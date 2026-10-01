import { avatarColorForIndex } from "@/theme/tokens";
import type { Bill, BillItem, Claim, Participant } from "@/types";

/**
 * The Phase 1/2 mock bill — used until Supabase (Phase 3) provides real
 * data. "You" is always participant id "you" and always first/coral.
 */

export const YOU_PARTICIPANT_ID = "you";

export const mockBill: Bill = {
  id: "friday-dinner",
  title: "Friday Dinner",
  venue: "Luigi's",
  location: "Ljubljana",
  date: "2026-08-20",
  createdBy: YOU_PARTICIPANT_ID,
  status: "active",
  serviceCents: 894, // 10% of the 8940 subtotal
  tipCents: 0,
  taxCents: 0,
  discountCents: 0,
  receiptTotalCents: 9834,
  currency: "EUR",
};

export const mockParticipants: Participant[] = [
  {
    id: "you",
    billId: mockBill.id,
    name: "You",
    colour: avatarColorForIndex(0),
    isDone: false,
    paymentStatus: "not_paid",
  },
  {
    id: "jacob",
    billId: mockBill.id,
    name: "Jacob",
    colour: avatarColorForIndex(1),
    isDone: false,
    paymentStatus: "not_paid",
  },
  {
    id: "martin",
    billId: mockBill.id,
    name: "Martin",
    colour: avatarColorForIndex(2),
    isDone: false,
    paymentStatus: "not_paid",
  },
  {
    id: "rebecca",
    billId: mockBill.id,
    name: "Rebecca",
    colour: avatarColorForIndex(3),
    isDone: false,
    paymentStatus: "not_paid",
  },
];

// "Identical items are separate rows" — 2x Lager becomes two €4.50 rows,
// never a single "×2" row, so two different people can each claim one.
export const mockItems: BillItem[] = [
  { id: "wine-1", billId: mockBill.id, name: "Red wine", emoji: "🍷", priceCents: 600, position: 0 },
  { id: "wine-2", billId: mockBill.id, name: "Red wine", emoji: "🍷", priceCents: 600, position: 1 },
  { id: "lager-1", billId: mockBill.id, name: "Lager", emoji: "🍺", priceCents: 450, position: 2 },
  { id: "lager-2", billId: mockBill.id, name: "Lager", emoji: "🍺", priceCents: 450, position: 3 },
  { id: "juice-1", billId: mockBill.id, name: "Fresh juice", emoji: "🧃", priceCents: 350, position: 4 },
  {
    id: "pizza-1",
    billId: mockBill.id,
    name: "Margherita pizza",
    emoji: "🍕",
    priceCents: 1800,
    position: 5,
  },
  {
    id: "pasta-1",
    billId: mockBill.id,
    name: "Truffle pasta",
    emoji: "🍝",
    priceCents: 1680,
    position: 6,
  },
  { id: "tiramisu-1", billId: mockBill.id, name: "Tiramisu", emoji: "🍰", priceCents: 850, position: 7 },
  {
    id: "bruschetta-1",
    billId: mockBill.id,
    name: "Bruschetta",
    emoji: "🥖",
    priceCents: 480,
    position: 8,
  },
  {
    id: "bruschetta-2",
    billId: mockBill.id,
    name: "Bruschetta",
    emoji: "🥖",
    priceCents: 480,
    position: 9,
  },
  {
    id: "water-1",
    billId: mockBill.id,
    name: "Sparkling water",
    emoji: "💧",
    priceCents: 300,
    position: 10,
  },
  {
    id: "water-2",
    billId: mockBill.id,
    name: "Sparkling water",
    emoji: "💧",
    priceCents: 300,
    position: 11,
  },
  { id: "espresso-1", billId: mockBill.id, name: "Espresso", emoji: "☕", priceCents: 200, position: 12 },
  { id: "espresso-2", billId: mockBill.id, name: "Espresso", emoji: "☕", priceCents: 200, position: 13 },
  { id: "espresso-3", billId: mockBill.id, name: "Espresso", emoji: "☕", priceCents: 200, position: 14 },
];

// A handful of items start pre-claimed so the screen demos both sections
// (and a running tab that isn't €0.00) the moment it opens; the rest are
// left "on the table" to tap through.
export const mockClaims: Claim[] = [
  { id: "c1", itemId: "wine-1", participantId: "jacob", shareCents: 600 },
  { id: "c2", itemId: "wine-2", participantId: "you", shareCents: 600 },
  { id: "c3", itemId: "lager-1", participantId: "martin", shareCents: 450 },
  { id: "c4", itemId: "pizza-1", participantId: "you", shareCents: 900 },
  { id: "c5", itemId: "pizza-1", participantId: "rebecca", shareCents: 900 },
  { id: "c6", itemId: "pasta-1", participantId: "martin", shareCents: 1680 },
  { id: "c7", itemId: "tiramisu-1", participantId: "you", shareCents: 284 },
  { id: "c8", itemId: "tiramisu-1", participantId: "jacob", shareCents: 283 },
  { id: "c9", itemId: "tiramisu-1", participantId: "rebecca", shareCents: 283 },
  { id: "c10", itemId: "bruschetta-1", participantId: "rebecca", shareCents: 480 },
  { id: "c11", itemId: "water-1", participantId: "you", shareCents: 300 },
  { id: "c12", itemId: "espresso-1", participantId: "jacob", shareCents: 200 },
  { id: "c13", itemId: "espresso-2", participantId: "martin", shareCents: 200 },
];
