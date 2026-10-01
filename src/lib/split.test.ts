/// <reference types="jest" />
import {
  allocateProportional,
  computeParticipantTotals,
  isUnevenSplitValid,
  splitByPercentages,
  splitEqual,
  sumCents,
} from "./split";

describe("splitEqual", () => {
  it("divides evenly when it divides evenly", () => {
    const shares = splitEqual(900, ["a", "b", "c"]);
    expect(shares).toEqual({ a: 300, b: 300, c: 300 });
  });

  it("hands out leftover cents one at a time in participant order", () => {
    // 1000 / 3 = 333.33... -> 334, 333, 333, summing back to 1000
    const shares = splitEqual(1000, ["a", "b", "c"]);
    expect(shares).toEqual({ a: 334, b: 333, c: 333 });
    expect(sumCents(Object.values(shares))).toBe(1000);
  });

  it("gives the leftover to whoever is earlier in the order", () => {
    const shares = splitEqual(1000, ["c", "b", "a"]);
    expect(shares).toEqual({ c: 334, b: 333, a: 333 });
  });

  it("returns an empty object for no participants", () => {
    expect(splitEqual(1000, [])).toEqual({});
  });

  it("always sums exactly to the original amount, however many participants", () => {
    for (let n = 1; n <= 11; n++) {
      const ids = Array.from({ length: n }, (_, i) => `p${i}`);
      const shares = splitEqual(1801, ids);
      expect(sumCents(Object.values(shares))).toBe(1801);
    }
  });
});

describe("isUnevenSplitValid", () => {
  it("accepts shares that add up exactly to the item price", () => {
    expect(isUnevenSplitValid([600, 400, 800], 1800)).toBe(true);
  });

  it("rejects shares that don't add up", () => {
    expect(isUnevenSplitValid([600, 400], 1800)).toBe(false);
  });

  it("rejects negative shares even if the sum happens to match", () => {
    expect(isUnevenSplitValid([2000, -200], 1800)).toBe(false);
  });

  it("rejects non-integer shares", () => {
    expect(isUnevenSplitValid([600.5, 1199.5], 1800)).toBe(false);
  });
});

describe("splitByPercentages", () => {
  it("splits proportionally and leftover cents sum back exactly", () => {
    // 33.3 / 33.3 / 33.4 of €10.00 (1000c)
    const shares = splitByPercentages(1000, ["a", "b", "c"], [33.3, 33.3, 33.4]);
    expect(sumCents(Object.values(shares))).toBe(1000);
  });

  it("falls back to an equal split if all percentages are 0", () => {
    const shares = splitByPercentages(900, ["a", "b", "c"], [0, 0, 0]);
    expect(shares).toEqual({ a: 300, b: 300, c: 300 });
  });
});

describe("allocateProportional (service / tip / tax / discount)", () => {
  const subtotals = { you: 4000, jacob: 2000, martin: 0 };

  it("allocates in proportion to each participant's item subtotal", () => {
    // total subtotal 6000c, service 894c (10% of 8940 in the mock bill's spirit)
    const shares = allocateProportional(894, subtotals, ["you", "jacob", "martin"]);
    // you: 894 * 4000/6000 = 596, jacob: 894 * 2000/6000 = 298, martin: 0
    expect(shares).toEqual({ you: 596, jacob: 298, martin: 0 });
    expect(sumCents(Object.values(shares))).toBe(894);
  });

  it("leftover rounding cents always land on someone, preserving the exact total", () => {
    const shares = allocateProportional(101, { a: 1, b: 1, c: 1 }, ["a", "b", "c"]);
    expect(sumCents(Object.values(shares))).toBe(101);
  });

  it("falls back to an equal split when nobody has claimed anything yet", () => {
    const shares = allocateProportional(900, { a: 0, b: 0, c: 0 }, ["a", "b", "c"]);
    expect(shares).toEqual({ a: 300, b: 300, c: 300 });
  });

  it("returns all zeros when the charge itself is zero", () => {
    const shares = allocateProportional(0, subtotals, ["you", "jacob", "martin"]);
    expect(shares).toEqual({ you: 0, jacob: 0, martin: 0 });
  });
});

describe("computeParticipantTotals", () => {
  const order = ["you", "jacob", "martin"];
  const itemsSubtotal = { you: 4000, jacob: 2000, martin: 1000 };
  const charges = { serviceCents: 700, tipCents: 0, taxCents: 0, discountCents: 0 };

  it("adds each participant's proportional service charge to their item subtotal", () => {
    const totals = computeParticipantTotals(
      charges,
      itemsSubtotal,
      [{ id: "you" }, { id: "jacob" }, { id: "martin" }],
      order
    );
    // service 700 split 4000:2000:1000 (ratio 4:2:1) -> 400, 200, 100
    expect(totals.you.serviceCents).toBe(400);
    expect(totals.jacob.serviceCents).toBe(200);
    expect(totals.martin.serviceCents).toBe(100);
    expect(totals.you.totalCents).toBe(4400);
    expect(totals.jacob.totalCents).toBe(2200);
    expect(totals.martin.totalCents).toBe(1100);
  });

  it("applies a discount proportionally as a reduction", () => {
    const totals = computeParticipantTotals(
      { serviceCents: 0, tipCents: 0, taxCents: 0, discountCents: 700 },
      itemsSubtotal,
      [{ id: "you" }, { id: "jacob" }, { id: "martin" }],
      order
    );
    expect(totals.you.discountCents).toBe(400);
    expect(totals.you.totalCents).toBe(4000 - 400);
    expect(totals.jacob.totalCents).toBe(2000 - 200);
    expect(totals.martin.totalCents).toBe(1000 - 100);
  });

  it("lets one participant pay for another — the covered person owes exactly 0", () => {
    const totals = computeParticipantTotals(
      charges,
      itemsSubtotal,
      [{ id: "you" }, { id: "jacob", coveredBy: "you" }, { id: "martin" }],
      order
    );

    expect(totals.jacob.totalCents).toBe(0);
    expect(totals.jacob.coveredBy).toBe("you");
    // "you" now owes their own total plus everything jacob owed
    expect(totals.you.coveringForCents).toBe(totals.jacob.rawTotalCents);
    expect(totals.you.totalCents).toBe(totals.you.rawTotalCents + totals.jacob.rawTotalCents);
    // nothing is lost: martin + covered jacob's raw amount + you's total == grand total
    const grandTotal =
      itemsSubtotal.you + itemsSubtotal.jacob + itemsSubtotal.martin + charges.serviceCents;
    const distributed = totals.you.totalCents + totals.jacob.totalCents + totals.martin.totalCents;
    expect(distributed).toBe(grandTotal);
  });
});
