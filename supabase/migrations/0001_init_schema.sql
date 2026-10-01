-- Tab — initial schema (Phase 3)
-- Mirrors src/types/index.ts. Run this once in the Supabase SQL Editor
-- (Dashboard → SQL Editor → New query → paste → Run) on a fresh project.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  username text not null unique,
  bio text,
  avatar_url text,
  favourite_food text,
  favourite_drink text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create a profile row whenever someone signs up. `name` / `username`
-- come from the options.data passed to supabase.auth.signUp() on the client.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'username', 'user_' || substr(new.id::text, 1, 8))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- bills / bill_items / participants / claims
-- ─────────────────────────────────────────────────────────────────────────

create table public.bills (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  venue text not null,
  location text not null,
  date date not null,
  created_by uuid not null references public.profiles (id),
  status text not null default 'draft' check (status in ('draft', 'active', 'completed')),
  service_cents integer not null default 0,
  tip_cents integer not null default 0,
  tax_cents integer not null default 0,
  discount_cents integer not null default 0,
  receipt_total_cents integer not null default 0,
  currency text not null default 'EUR' check (currency in ('EUR', 'USD', 'GBP')),
  created_at timestamptz not null default now()
);

create table public.bill_items (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.bills (id) on delete cascade,
  name text not null,
  emoji text not null default '🍽️',
  price_cents integer not null,
  position integer not null default 0
);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.bills (id) on delete cascade,
  profile_id uuid references public.profiles (id),
  guest_name text,
  name text not null,
  colour text not null,
  is_done boolean not null default false,
  payment_status text not null default 'not_paid'
    check (payment_status in ('not_paid', 'requested', 'paid', 'confirmed')),
  covered_by uuid references public.participants (id)
);

create table public.claims (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.bill_items (id) on delete cascade,
  participant_id uuid not null references public.participants (id) on delete cascade,
  share_cents integer not null
);

alter table public.bills enable row level security;
alter table public.bill_items enable row level security;
alter table public.participants enable row level security;
alter table public.claims enable row level security;

-- A user can see a bill if they created it or are one of its participants.
create policy "Bill members can view a bill"
  on public.bills for select
  to authenticated
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.participants p
      where p.bill_id = bills.id and p.profile_id = auth.uid()
    )
  );

create policy "Users can create their own bills"
  on public.bills for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "Bill creator can update their bill"
  on public.bills for update
  to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy "Bill creator can delete their bill"
  on public.bills for delete
  to authenticated
  using (created_by = auth.uid());

create policy "Bill members can view items"
  on public.bill_items for select
  to authenticated
  using (
    exists (
      select 1 from public.bills b
      where b.id = bill_items.bill_id
        and (b.created_by = auth.uid()
          or exists (
            select 1 from public.participants p
            where p.bill_id = b.id and p.profile_id = auth.uid()
          ))
    )
  );

create policy "Bill creator manages items"
  on public.bill_items for all
  to authenticated
  using (exists (select 1 from public.bills b where b.id = bill_items.bill_id and b.created_by = auth.uid()))
  with check (exists (select 1 from public.bills b where b.id = bill_items.bill_id and b.created_by = auth.uid()));

create policy "Bill members can view participants"
  on public.participants for select
  to authenticated
  using (
    exists (
      select 1 from public.bills b
      where b.id = participants.bill_id
        and (b.created_by = auth.uid()
          or exists (
            select 1 from public.participants p2
            where p2.bill_id = b.id and p2.profile_id = auth.uid()
          ))
    )
  );

create policy "Bill creator manages participants"
  on public.participants for all
  to authenticated
  using (exists (select 1 from public.bills b where b.id = participants.bill_id and b.created_by = auth.uid()))
  with check (exists (select 1 from public.bills b where b.id = participants.bill_id and b.created_by = auth.uid()));

create policy "Participant updates their own status"
  on public.participants for update
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "Bill members can view claims"
  on public.claims for select
  to authenticated
  using (
    exists (
      select 1 from public.participants p
      join public.bills b on b.id = p.bill_id
      where p.id = claims.participant_id
        and (b.created_by = auth.uid()
          or exists (
            select 1 from public.participants p2
            where p2.bill_id = b.id and p2.profile_id = auth.uid()
          ))
    )
  );

create policy "Bill members manage claims"
  on public.claims for all
  to authenticated
  using (
    exists (
      select 1 from public.participants p
      join public.bills b on b.id = p.bill_id
      where p.id = claims.participant_id
        and (b.created_by = auth.uid()
          or exists (
            select 1 from public.participants p2
            where p2.bill_id = b.id and p2.profile_id = auth.uid()
          ))
    )
  )
  with check (
    exists (
      select 1 from public.participants p
      join public.bills b on b.id = p.bill_id
      where p.id = claims.participant_id
        and (b.created_by = auth.uid()
          or exists (
            select 1 from public.participants p2
            where p2.bill_id = b.id and p2.profile_id = auth.uid()
          ))
    )
  );

-- ─────────────────────────────────────────────────────────────────────────
-- friendships
-- ─────────────────────────────────────────────────────────────────────────

create table public.friendships (
  user_id uuid not null references public.profiles (id),
  friend_id uuid not null references public.profiles (id),
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);

alter table public.friendships enable row level security;

create policy "Users can view their own friendships"
  on public.friendships for select
  to authenticated
  using (user_id = auth.uid() or friend_id = auth.uid());

create policy "Users can send a friend request"
  on public.friendships for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Either side can update a friendship"
  on public.friendships for update
  to authenticated
  using (user_id = auth.uid() or friend_id = auth.uid())
  with check (user_id = auth.uid() or friend_id = auth.uid());

create policy "Either side can remove a friendship"
  on public.friendships for delete
  to authenticated
  using (user_id = auth.uid() or friend_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────
-- memories
-- ─────────────────────────────────────────────────────────────────────────

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.bills (id) on delete cascade,
  author_id uuid not null references public.profiles (id),
  photo_url text not null,
  caption text,
  hashtags text[] not null default '{}',
  tagged_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.memories enable row level security;

create policy "Bill members can view memories"
  on public.memories for select
  to authenticated
  using (
    exists (
      select 1 from public.bills b
      where b.id = memories.bill_id
        and (b.created_by = auth.uid()
          or exists (
            select 1 from public.participants p
            where p.bill_id = b.id and p.profile_id = auth.uid()
          ))
    )
  );

create policy "Bill members can post memories"
  on public.memories for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.bills b
      where b.id = memories.bill_id
        and (b.created_by = auth.uid()
          or exists (
            select 1 from public.participants p
            where p.bill_id = b.id and p.profile_id = auth.uid()
          ))
    )
  );

create policy "Author manages their memory"
  on public.memories for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "Author deletes their memory"
  on public.memories for delete
  to authenticated
  using (author_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────
-- avatar storage
-- ─────────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar images are publicly readable"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

create policy "Users upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users replace their own avatar"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
