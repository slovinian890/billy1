-- Tab — social features (Phase 3b): public posts, follows, likes,
-- comments, and 1:1 realtime messaging.
-- Run this in the Supabase SQL Editor AFTER 0001_init_schema.sql.

-- ─────────────────────────────────────────────────────────────────────────
-- memories become standalone public posts — no longer require a synced
-- bill row (Bills still runs on local mock data), and carry their own
-- "flex" fields (venue + amount) instead of joining to public.bills.
-- ─────────────────────────────────────────────────────────────────────────

alter table public.memories alter column bill_id drop not null;
alter table public.memories add column venue text;
alter table public.memories add column amount_cents integer;

drop policy if exists "Bill members can view memories" on public.memories;
drop policy if exists "Bill members can post memories" on public.memories;

create policy "Memories are publicly viewable"
  on public.memories for select
  to authenticated
  using (true);

create policy "Users post their own memories"
  on public.memories for insert
  to authenticated
  with check (author_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────
-- follows — asymmetric, Instagram-style (no approval needed)
-- ─────────────────────────────────────────────────────────────────────────

create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

alter table public.follows enable row level security;

create policy "Follows are publicly viewable"
  on public.follows for select
  to authenticated
  using (true);

create policy "Users follow as themselves"
  on public.follows for insert
  to authenticated
  with check (follower_id = auth.uid());

create policy "Users unfollow as themselves"
  on public.follows for delete
  to authenticated
  using (follower_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────
-- likes + comments on memories
-- ─────────────────────────────────────────────────────────────────────────

create table public.memory_likes (
  memory_id uuid not null references public.memories (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (memory_id, profile_id)
);

alter table public.memory_likes enable row level security;

create policy "Likes are publicly viewable"
  on public.memory_likes for select
  to authenticated
  using (true);

create policy "Users like as themselves"
  on public.memory_likes for insert
  to authenticated
  with check (profile_id = auth.uid());

create policy "Users unlike as themselves"
  on public.memory_likes for delete
  to authenticated
  using (profile_id = auth.uid());

create table public.memory_comments (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

alter table public.memory_comments enable row level security;

create policy "Comments are publicly viewable"
  on public.memory_comments for select
  to authenticated
  using (true);

create policy "Users comment as themselves"
  on public.memory_comments for insert
  to authenticated
  with check (author_id = auth.uid());

create policy "Users delete their own comment"
  on public.memory_comments for delete
  to authenticated
  using (author_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────
-- 1:1 conversations + messages (realtime)
-- ─────────────────────────────────────────────────────────────────────────

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references public.profiles (id) on delete cascade,
  user_b_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  check (user_a_id < user_b_id)
);

create unique index conversations_pair_idx on public.conversations (user_a_id, user_b_id);

alter table public.conversations enable row level security;

create policy "Participants view their conversation"
  on public.conversations for select
  to authenticated
  using (auth.uid() = user_a_id or auth.uid() = user_b_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "Participants view their messages"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.user_a_id = auth.uid() or c.user_b_id = auth.uid())
    )
  );

create policy "Participants send messages"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.user_a_id = auth.uid() or c.user_b_id = auth.uid())
    )
  );

create function public.bump_conversation_last_message()
returns trigger
language plpgsql
security definer set search_path = public
as $body$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end;
$body$;

create trigger messages_bump_conversation
  after insert on public.messages
  for each row execute function public.bump_conversation_last_message();

-- Looks up (or creates) the 1:1 conversation with another user. Keeps a
-- canonical user_a_id < user_b_id ordering so each pair has exactly one row
-- — call this instead of inserting into conversations directly.
create function public.get_or_create_conversation(other_user_id uuid)
returns uuid
language plpgsql
security definer set search_path = public
as $body$
declare
  me uuid := auth.uid();
  a uuid;
  b uuid;
  conv_id uuid;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  if me = other_user_id then
    raise exception 'Cannot message yourself';
  end if;

  if me < other_user_id then
    a := me; b := other_user_id;
  else
    a := other_user_id; b := me;
  end if;

  select id into conv_id from public.conversations where user_a_id = a and user_b_id = b;
  if conv_id is null then
    insert into public.conversations (user_a_id, user_b_id) values (a, b)
    returning id into conv_id;
  end if;

  return conv_id;
end;
$body$;

grant execute on function public.get_or_create_conversation(uuid) to authenticated;

-- Live INSERT events on messages power the realtime chat thread.
alter publication supabase_realtime add table public.messages;

-- ─────────────────────────────────────────────────────────────────────────
-- memory photo storage
-- ─────────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('memories', 'memories', true)
on conflict (id) do nothing;

create policy "Memory photos are publicly readable"
  on storage.objects for select
  to public
  using (bucket_id = 'memories');

create policy "Users upload their own memory photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'memories' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users delete their own memory photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'memories' and (storage.foldername(name))[1] = auth.uid()::text);
