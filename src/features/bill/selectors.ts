import { computeParticipantTotals, type ParticipantTotal } from "@/lib/split";
import type { AvatarStackPerson } from "@/components/AvatarStack";
import type { Bill, BillItem, Claim, Participant } from "@/types";

export function claimsForItem(claims: Claim[], itemId: string): Claim[] {
  return claims.filter((c) => c.itemId === itemId);
}

export function isItemClaimed(claims: Claim[], itemId: string): boolean {
  return claimsForItem(claims, itemId).length > 0;
}

export function participantById(participants: Participant[], id: string): Participant | undefined {
  return participants.find((p) => p.id === id);
}

/** The people (with colour) currently claiming/splitting an item, for AvatarStack. */
export function claimedPeopleForItem(
  claims: Claim[],
  participants: Participant[],
  itemId: string
): AvatarStackPerson[] {
  return claimsForItem(claims, itemId).map((claim) => {
    const participant = participantById(participants, claim.participantId);
    return {
      id: claim.participantId,
      name: participant?.name ?? "Someone",
      color: participant?.colour ?? "#a09791",
    };
  });
}

export function splitItems(items: BillItem[], claims: Claim[]): { unclaimed: BillItem[]; claimed: BillItem[] } {
  const unclaimed: BillItem[] = [];
  const claimed: BillItem[] = [];
  for (const item of items) {
    (isItemClaimed(claims, item.id) ? claimed : unclaimed).push(item);
  }
  return { unclaimed, claimed };
}

export function itemsSubtotalCents(items: BillItem[]): number {
  return items.reduce((sum, item) => sum + item.priceCents, 0);
}

export function claimedCount(items: BillItem[], claims: Claim[]): { claimed: number; total: number } {
  const claimed = items.filter((item) => isItemClaimed(claims, item.id)).length;
  return { claimed, total: items.length };
}

/** Each participant's item subtotal, keyed by participant id. */
export function itemsSubtotalByParticipant(claims: Claim[]): Record<string, number> {
  const subtotals: Record<string, number> = {};
  for (const claim of claims) {
    subtotals[claim.participantId] = (subtotals[claim.participantId] ?? 0) + claim.shareCents;
  }
  return subtotals;
}

/** Full money breakdown for every participant on the bill, coverage resolved. */
export function computeBillTotals(
  bill: Bill,
  claims: Claim[],
  participants: Participant[]
): Record<string, ParticipantTotal> {
  const order = participants.map((p) => p.id);
  return computeParticipantTotals(
    {
      serviceCents: bill.serviceCents,
      tipCents: bill.tipCents,
      taxCents: bill.taxCents,
      discountCents: bill.discountCents,
    },
    itemsSubtotalByParticipant(claims),
    participants,
    order
  );
}
