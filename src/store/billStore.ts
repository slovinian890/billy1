import { create } from "zustand";

import { splitEqual } from "@/lib/split";
import { mockBill, mockClaims, mockItems, mockParticipants } from "@/lib/mock/fridayDinner";
import type { Bill, BillItem, Claim, Participant } from "@/types";

let claimIdCounter = 1000;
function nextClaimId(): string {
  claimIdCounter += 1;
  return `claim-${claimIdCounter}`;
}

interface BillState {
  bill: Bill;
  participants: Participant[];
  items: BillItem[];
  claims: Claim[];

  /** One person claims the whole item for themselves. */
  claimItem: (itemId: string, participantId: string) => void;

  /**
   * Splits an item between several participants. Pass `customCents` (must
   * sum exactly to the item price — validate with `isUnevenSplitValid`
   * first) for an uneven split, or omit it for an equal split.
   */
  splitItem: (itemId: string, participantIds: string[], customCents?: Record<string, number>) => void;

  /** Clears every claim on an item, returning it to "still on the table". */
  unclaimItem: (itemId: string) => void;

  setParticipantDone: (participantId: string, isDone: boolean) => void;

  setCoveredBy: (participantId: string, coveredBy: string | undefined) => void;

  /** Resets everything back to the original mock state (dev/demo helper). */
  reset: () => void;
}

export const useBillStore = create<BillState>((set) => ({
  bill: mockBill,
  participants: mockParticipants,
  items: mockItems,
  claims: mockClaims,

  claimItem: (itemId, participantId) =>
    set((state) => {
      const item = state.items.find((i) => i.id === itemId);
      if (!item) return state;
      const withoutItem = state.claims.filter((c) => c.itemId !== itemId);
      return {
        claims: [
          ...withoutItem,
          { id: nextClaimId(), itemId, participantId, shareCents: item.priceCents },
        ],
      };
    }),

  splitItem: (itemId, participantIds, customCents) =>
    set((state) => {
      const item = state.items.find((i) => i.id === itemId);
      if (!item || participantIds.length === 0) return state;

      const shares = customCents ?? splitEqual(item.priceCents, participantIds);
      const withoutItem = state.claims.filter((c) => c.itemId !== itemId);
      const newClaims: Claim[] = participantIds.map((participantId) => ({
        id: nextClaimId(),
        itemId,
        participantId,
        shareCents: shares[participantId] ?? 0,
      }));

      return { claims: [...withoutItem, ...newClaims] };
    }),

  unclaimItem: (itemId) =>
    set((state) => ({ claims: state.claims.filter((c) => c.itemId !== itemId) })),

  setParticipantDone: (participantId, isDone) =>
    set((state) => ({
      participants: state.participants.map((p) => (p.id === participantId ? { ...p, isDone } : p)),
    })),

  setCoveredBy: (participantId, coveredBy) =>
    set((state) => ({
      participants: state.participants.map((p) =>
        p.id === participantId ? { ...p, coveredBy } : p
      ),
    })),

  reset: () => set({ bill: mockBill, participants: mockParticipants, items: mockItems, claims: mockClaims }),
}));
