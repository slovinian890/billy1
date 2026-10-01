/**
 * Core data model for Tab.
 *
 * These mirror the future Supabase tables (see Phase 3). Money is always
 * stored as integer cents — never floating point — see `src/lib/money.ts`
 * and `src/lib/split.ts`.
 */

export type Currency = "EUR" | "USD" | "GBP";

export interface Profile {
  id: string;
  name: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
  favouriteFood?: string;
  favouriteDrink?: string;
}

export type BillStatus = "draft" | "active" | "completed";

export interface Bill {
  id: string;
  title: string;
  venue: string;
  location: string;
  /** ISO 8601 date string */
  date: string;
  createdBy: string;
  status: BillStatus;
  serviceCents: number;
  tipCents: number;
  taxCents: number;
  discountCents: number;
  receiptTotalCents: number;
  currency: Currency;
}

export interface BillItem {
  id: string;
  billId: string;
  name: string;
  emoji: string;
  priceCents: number;
  /** Sort order on the receipt / bill screen */
  position: number;
}

export type PaymentStatus = "not_paid" | "requested" | "paid" | "confirmed";

export interface Participant {
  id: string;
  billId: string;
  /** Set for a signed-in friend */
  profileId?: string;
  /** Set for a guest who joined via link */
  guestName?: string;
  name: string;
  colour: string;
  isDone: boolean;
  paymentStatus: PaymentStatus;
  /** Participant id of whoever is covering this person's share, if any */
  coveredBy?: string;
}

/**
 * One row = a full claim on an item (shareCents === item price).
 * Several rows for the same itemId = a split.
 */
export interface Claim {
  id: string;
  itemId: string;
  participantId: string;
  shareCents: number;
}

export type FriendshipStatus = "pending" | "accepted";

export interface Friendship {
  userId: string;
  friendId: string;
  status: FriendshipStatus;
}

export interface Memory {
  id: string;
  /** Posts aren't required to link back to a synced bill — Bills still runs on local mock data. */
  billId?: string;
  authorId: string;
  photoUrl: string;
  caption: string;
  hashtags: string[];
  taggedIds: string[];
  /** Free-text "what" and "how much" for flexing — not tied to a real bill row. */
  venue?: string;
  amountCents?: number;
  createdAt: string;
}
