# Tab

_split the bill · keep the vibe_

A social bill-splitting app built with Expo + TypeScript, designed to run entirely in **Expo Go** (no dev client, no `expo prebuild`).

## Status

Building in phases — see the plan for the full roadmap. Currently done:

- **Phase 1** — theme, navigation, shared components, and the Active Bill screen (mock data). ✅
- **Phase 3 (partial)** — Supabase project, full SQL schema + RLS for every table, email/password auth (sign up / sign in / sign out), and a real Profile tab backed by the `profiles` table + Storage avatars. ✅
- **Phase 5 (partial)** — Profile tab is fully built (see above). ✅

Not built yet: the Scan tab camera flow (Phase 2), friends/realtime and syncing the Bills tab to Supabase (rest of Phase 3), guest links/payments (Phase 4), the Memories feed (rest of Phase 5). Those tabs currently show a friendly "coming soon" placeholder and the Bills tab still runs on local mock data (`src/store/billStore.ts`).

## Run it in Expo Go

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npx expo start
   ```
3. Scan the QR code with the **Expo Go** app on your iPhone or Android phone (or press `i` / `a` in the terminal for a simulator/emulator if you have one set up).
4. Open the **Bills** tab to see the mock "Friday Dinner" bill — tap any item to claim or split it, or tap "I'm done" for your running total.

## Tests

Pure money-splitting logic (`src/lib/split.ts`) has a full Jest suite:

```bash
npm test
```

## Project structure

```
src/
  app/                 expo-router routes (file-based)
    _layout.tsx         root layout: fonts, auth gate, gesture handler, bottom sheets, toast
    (auth)/              sign-in / sign-up (shown when signed out)
    (tabs)/              the 5-tab bottom navigation (shown when signed in)
  components/           shared UI: Button, Card, TextField, Avatar, AvatarStack, ItemRow, MoneyText, EyebrowTitle, Toast, ProgressBar
  features/<feature>/   feature-specific screens & logic (e.g. features/bill, features/profile)
  lib/                  pure, framework-free logic — money formatting, split math, mock data, Supabase client
  store/                Zustand stores (billStore, authStore, toastStore)
  theme/                design tokens (colours, type, spacing) and font loading
  types/                shared TypeScript data model + generated-style Supabase Database type
supabase/
  migrations/          SQL schema + RLS, run manually in the Supabase SQL Editor
```

> Routes live in `src/app` rather than a top-level `app/`, matching this project's existing Expo Router "src" convention (confirmed against the SDK's own docs) — everything else follows the folder layout above.

## Supabase setup

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Run the schema: **Dashboard → SQL Editor → New query**, paste the contents of
   [`supabase/migrations/0001_init_schema.sql`](supabase/migrations/0001_init_schema.sql), and run it. This
   creates `profiles` / `bills` / `bill_items` / `participants` / `claims` / `friendships` / `memories` with
   row-level security, a trigger that creates a `profiles` row on sign-up, and a public `avatars` storage bucket.
3. Copy your credentials from **Project Settings → API** (the Project URL and the `anon` `public` key) into `.env`
   (copy `.env.example` if you don't have one — `.env` is already git-ignored):
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
   ```
4. Restart the dev server (`npx expo start -c` to clear the env cache).

Without a configured `.env`, the app skips the sign-in gate entirely and opens straight into the tabs on local
mock data — see `isSupabaseConfigured` in `src/lib/supabase.ts`.

**Auth & data layer:**
- `src/lib/supabase.ts` — the Supabase client (AsyncStorage-backed session persistence).
- `src/store/authStore.ts` — zustand store wrapping `supabase.auth` (session, profile, sign up/in/out, profile
  updates) and keeping itself in sync via `onAuthStateChange`.
- `src/app/(auth)/` — sign-in / sign-up screens. `src/app/_layout.tsx` gates `(tabs)` vs. `(auth)` with
  `Stack.Protected` based on session state.
- The **Profile** tab (`src/app/(tabs)/profile.tsx`) reads/writes the real `profiles` row, including avatar
  uploads to the `avatars` Storage bucket.
