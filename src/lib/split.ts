/**
 * Pure money-splitting logic for Tab. No React, no I/O — just integer-cent
 * arithmetic so it's trivially unit-testable and reusable from the client
 * and (later) from a Supabase edge function / RPC.
 *
 * Ground rules:
 *  - Every amount is an integer number of cents. Never floating point.
 *  - Whenever an amount doesn't divide evenly, the leftover cents are handed
 *    out ONE AT A TIME, in a stable participant order, so shares always sum
 *    back to exactly the original amount.
 */

/**
 * Computes `Math.floor((a * b) / denominator)` via BigInt so the
 * intermediate product never loses precision to floating point, however
 * large `a * b` gets.
 */
function proportionalShare(a: number, b: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Number((BigInt(a) * BigInt(b)) / BigInt(denominator));
}

/**
 * Splits `totalCents` evenly across `participantIds`. If it doesn't divide
 * evenly, the first participants in `participantIds` (in order) get one
 * extra cent each until the leftover is gone — so `sum(result) === totalCents`
 * always holds.
 */
export function splitEqual(
  totalCents: number,
  participantIds: string[]
): Record<string, number> {
  const shares: Record<string, number> = {};
  const n = participantIds.length;
  if (n === 0) return shares;

  const base = Math.floor(totalCents / n);
  const remainder = totalCents - base * n;

  participantIds.forEach((id, index) => {
    shares[id] = base + (index < remainder ? 1 : 0);
  });

  return shares;
}

/**
 * Splits `totalCents` across `participantIds` in proportion to `percentages`
 * (parallel arrays, percentages need not be pre-validated to sum to 100 —
 * that's the caller's job via `sumCents`/UI validation). Leftover cents from
 * rounding are handed out in participant order, same rule as `splitEqual`.
 */
export function splitByPercentages(
  totalCents: number,
  participantIds: string[],
  percentages: number[]
): Record<string, number> {
  const shares: Record<string, number> = {};
  if (participantIds.length === 0) return shares;

  // Percentages may have decimals (e.g. 33.3); scale to integer "weights"
  // (3 decimal places) so proportionalShare's BigInt math stays exact.
  const weights = percentages.map((p) => Math.round(p * 1000));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight === 0) return splitEqual(totalCents, participantIds);

  let allocated = 0;
  participantIds.forEach((id, index) => {
    const share = proportionalShare(totalCents, weights[index], totalWeight);
    shares[id] = share;
    allocated += share;
  });

  let remainder = totalCents - allocated;
  for (const id of participantIds) {
    if (remainder <= 0) break;
    shares[id] += 1;
    remainder -= 1;
  }

  return shares;
}

export function sumCents(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0);
}

/**
 * A custom ("uneven") split is only confirmable once every share is a
 * non-negative integer and they add up to exactly the item price.
 */
export function isUnevenSplitValid(shareCents: number[], totalCents: number): boolean {
  if (shareCents.some((c) => !Number.isInteger(c) || c < 0)) return false;
  return sumCents(shareCents) === totalCents;
}

/**
 * Allocates `totalCents` (a service charge, tip, tax, or discount amount)
 * across participants IN PROPORTION to each participant's item subtotal —
 * e.g. someone whose items were 40% of the claimed subtotal pays 40% of the
 * service charge. Falls back to an equal split if nobody has claimed
 * anything yet (subtotal is 0 for everyone), so charges never vanish.
 *
 * `order` fixes the stable order used to hand out leftover rounding cents.
 */
export function allocateProportional(
  totalCents: number,
  subtotalsByParticipant: Record<string, number>,
  order: string[]
): Record<string, number> {
  const shares: Record<string, number> = {};
  if (order.length === 0) return shares;
  if (totalCents === 0) {
    order.forEach((id) => (shares[id] = 0));
    return shares;
  }

  const sumSubtotal = order.reduce((sum, id) => sum + (subtotalsByParticipant[id] ?? 0), 0);
  if (sumSubtotal === 0) return splitEqual(totalCents, order);

  let allocated = 0;
  for (const id of order) {
    const subtotal = subtotalsByParticipant[id] ?? 0;
    const share = proportionalShare(totalCents, subtotal, sumSubtotal);
    shares[id] = share;
    allocated += share;
  }

  let remainder = totalCents - allocated;
  for (const id of order) {
    if (remainder <= 0) break;
    shares[id] += 1;
    remainder -= 1;
  }

  return shares;
}

export interface ChargesCents {
  serviceCents: number;
  tipCents: number;
  taxCents: number;
  discountCents: number;
}

export interface CoverageInfo {
  id: string;
  /** Participant id of whoever is paying this person's share, if any */
  coveredBy?: string;
}

export interface ParticipantTotal {
  participantId: string;
  itemsSubtotalCents: number;
  serviceCents: number;
  tipCents: number;
  taxCents: number;
  discountCents: number;
  /** What this person's share adds up to before any "pay for someone" coverage */
  rawTotalCents: number;
  /** Who is covering this person, if anyone (their own `totalCents` is then 0) */
  coveredBy?: string;
  /** Extra amount this person is covering on behalf of others */
  coveringForCents: number;
  /** Final amount this participant owes */
  totalCents: number;
}

/**
 * Combines each participant's claimed-item subtotal with their proportional
 * share of service/tip/tax/discount, then resolves "pay for someone"
 * coverage: a covered participant's final total is always 0, and whatever
 * they owed is folded into their payer's total instead.
 *
 * `order` should be a stable list of participant ids (e.g. join order) —
 * it's only used to decide who gets the odd leftover cent.
 */
export function computeParticipantTotals(
  charges: ChargesCents,
  itemsSubtotalByParticipant: Record<string, number>,
  participants: CoverageInfo[],
  order: string[]
): Record<string, ParticipantTotal> {
  const serviceShares = allocateProportional(charges.serviceCents, itemsSubtotalByParticipant, order);
  const tipShares = allocateProportional(charges.tipCents, itemsSubtotalByParticipant, order);
  const taxShares = allocateProportional(charges.taxCents, itemsSubtotalByParticipant, order);
  const discountShares = allocateProportional(charges.discountCents, itemsSubtotalByParticipant, order);

  const totals: Record<string, ParticipantTotal> = {};

  for (const id of order) {
    const itemsSubtotalCents = itemsSubtotalByParticipant[id] ?? 0;
    const serviceCents = serviceShares[id] ?? 0;
    const tipCents = tipShares[id] ?? 0;
    const taxCents = taxShares[id] ?? 0;
    const discountCents = discountShares[id] ?? 0;
    const rawTotalCents = itemsSubtotalCents + serviceCents + tipCents + taxCents - discountCents;

    totals[id] = {
      participantId: id,
      itemsSubtotalCents,
      serviceCents,
      tipCents,
      taxCents,
      discountCents,
      rawTotalCents,
      coveringForCents: 0,
      totalCents: rawTotalCents,
    };
  }

  const byId = new Map(participants.map((p) => [p.id, p]));

  for (const id of order) {
    const participant = byId.get(id);
    const total = totals[id];
    if (!participant?.coveredBy || !totals[participant.coveredBy]) continue;

    const payer = totals[participant.coveredBy];
    payer.coveringForCents += total.rawTotalCents;
    payer.totalCents += total.rawTotalCents;
    total.coveredBy = participant.coveredBy;
    total.totalCents = 0;
  }

  return totals;
}
