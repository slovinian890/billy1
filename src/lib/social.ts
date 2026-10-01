import { supabase } from "@/lib/supabase";
import type { ProfileRow } from "@/types/database";

export interface FeedAuthor {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
}

export interface FeedPost {
  id: string;
  authorId: string;
  author: FeedAuthor;
  photoUrl: string;
  caption: string | null;
  hashtags: string[];
  taggedIds: string[];
  venue: string | null;
  amountCents: number | null;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
}

interface RawFeedRow {
  id: string;
  author_id: string;
  photo_url: string;
  caption: string | null;
  hashtags: string[] | null;
  tagged_ids: string[] | null;
  venue: string | null;
  amount_cents: number | null;
  created_at: string;
  author: { id: string; name: string; username: string; avatar_url: string | null } | null;
  memory_likes: { count: number }[] | null;
  memory_comments: { count: number }[] | null;
}

/** Latest posts first, newest 50 — pull-to-refresh re-runs this. */
export async function fetchFeed(myId: string): Promise<FeedPost[]> {
  const { data, error } = await supabase
    .from("memories")
    .select(
      "id, author_id, photo_url, caption, hashtags, tagged_ids, venue, amount_cents, created_at, author:profiles!memories_author_id_fkey(id, name, username, avatar_url), memory_likes(count), memory_comments(count)"
    )
    .order("created_at", { ascending: false })
    .limit(50)
    .overrideTypes<RawFeedRow[], { merge: false }>();
  if (error) throw error;

  const rows = data ?? [];
  const myLikes = rows.length > 0 ? await fetchMyLikedMemoryIds(myId, rows.map((r) => r.id)) : new Set<string>();

  return rows
    .filter((row): row is RawFeedRow & { author: NonNullable<RawFeedRow["author"]> } => row.author !== null)
    .map((row) => ({
      id: row.id,
      authorId: row.author_id,
      author: {
        id: row.author.id,
        name: row.author.name,
        username: row.author.username,
        avatarUrl: row.author.avatar_url,
      },
      photoUrl: row.photo_url,
      caption: row.caption,
      hashtags: row.hashtags ?? [],
      taggedIds: row.tagged_ids ?? [],
      venue: row.venue,
      amountCents: row.amount_cents,
      createdAt: row.created_at,
      likeCount: row.memory_likes?.[0]?.count ?? 0,
      commentCount: row.memory_comments?.[0]?.count ?? 0,
      likedByMe: myLikes.has(row.id),
    }));
}

async function fetchMyLikedMemoryIds(myId: string, memoryIds: string[]): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("memory_likes")
    .select("memory_id")
    .eq("profile_id", myId)
    .in("memory_id", memoryIds);
  if (error) throw error;
  return new Set((data ?? []).map((row) => row.memory_id));
}

export async function toggleLike(memoryId: string, myId: string, currentlyLiked: boolean): Promise<void> {
  if (currentlyLiked) {
    const { error } = await supabase
      .from("memory_likes")
      .delete()
      .eq("memory_id", memoryId)
      .eq("profile_id", myId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("memory_likes").insert({ memory_id: memoryId, profile_id: myId });
    if (error) throw error;
  }
}

export interface Comment {
  id: string;
  authorId: string;
  author: FeedAuthor;
  body: string;
  createdAt: string;
}

interface RawCommentRow {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  author: { id: string; name: string; username: string; avatar_url: string | null } | null;
}

export async function fetchComments(memoryId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from("memory_comments")
    .select("id, author_id, body, created_at, author:profiles(id, name, username, avatar_url)")
    .eq("memory_id", memoryId)
    .order("created_at", { ascending: true })
    .overrideTypes<RawCommentRow[], { merge: false }>();
  if (error) throw error;

  return (data ?? [])
    .filter((row): row is typeof row & { author: NonNullable<typeof row.author> } => row.author !== null)
    .map((row) => ({
      id: row.id,
      authorId: row.author_id,
      author: {
        id: row.author.id,
        name: row.author.name,
        username: row.author.username,
        avatarUrl: row.author.avatar_url,
      },
      body: row.body,
      createdAt: row.created_at,
    }));
}

export async function addComment(memoryId: string, authorId: string, body: string): Promise<void> {
  const { error } = await supabase.from("memory_comments").insert({ memory_id: memoryId, author_id: authorId, body });
  if (error) throw error;
}

export interface NewMemoryInput {
  authorId: string;
  photoUrl: string;
  caption?: string;
  hashtags?: string[];
  taggedIds?: string[];
  venue?: string;
  amountCents?: number;
}

export async function createMemory(input: NewMemoryInput): Promise<void> {
  const { error } = await supabase.from("memories").insert({
    author_id: input.authorId,
    photo_url: input.photoUrl,
    caption: input.caption ?? null,
    hashtags: input.hashtags ?? [],
    tagged_ids: input.taggedIds ?? [],
    venue: input.venue ?? null,
    amount_cents: input.amountCents ?? null,
  });
  if (error) throw error;
}

/** Only the author can delete — enforced again by RLS even if this check is bypassed. */
export async function deleteMemory(memoryId: string, authorId: string): Promise<void> {
  const { error } = await supabase.from("memories").delete().eq("id", memoryId).eq("author_id", authorId);
  if (error) throw error;
}

/** Uploads a local image URI to the public `memories` bucket, returns its public URL. */
export async function uploadMemoryPhoto(authorId: string, localUri: string): Promise<string> {
  const extension = localUri.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${authorId}/${Date.now()}.${extension}`;
  const arrayBuffer = await fetch(localUri).then((res) => res.arrayBuffer());

  const { error } = await supabase.storage.from("memories").upload(path, arrayBuffer, {
    contentType: `image/${extension === "jpg" ? "jpeg" : extension}`,
  });
  if (error) throw error;

  const { data } = supabase.storage.from("memories").getPublicUrl(path);
  return data.publicUrl;
}

export async function fetchProfilesByIds(ids: string[]): Promise<ProfileRow[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("profiles").select("*").in("id", ids);
  if (error) throw error;
  return data ?? [];
}

export async function searchProfiles(query: string, excludeId: string): Promise<ProfileRow[]> {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .or(`username.ilike.%${trimmed}%,name.ilike.%${trimmed}%`)
    .neq("id", excludeId)
    .limit(20);
  if (error) throw error;
  return data ?? [];
}

export interface FollowCounts {
  followers: number;
  following: number;
}

export async function fetchFollowCounts(profileId: string): Promise<FollowCounts> {
  const [followers, following] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", profileId),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profileId),
  ]);
  if (followers.error) throw followers.error;
  if (following.error) throw following.error;
  return { followers: followers.count ?? 0, following: following.count ?? 0 };
}

export async function fetchFollowingIds(profileId: string): Promise<Set<string>> {
  const { data, error } = await supabase.from("follows").select("following_id").eq("follower_id", profileId);
  if (error) throw error;
  return new Set((data ?? []).map((row) => row.following_id));
}

export async function fetchFollowers(profileId: string): Promise<ProfileRow[]> {
  const { data, error } = await supabase
    .from("follows")
    .select("follower:profiles!follows_follower_id_fkey(*)")
    .eq("following_id", profileId)
    .overrideTypes<{ follower: ProfileRow }[], { merge: false }>();
  if (error) throw error;
  return (data ?? []).map((row) => row.follower);
}

export async function fetchFollowing(profileId: string): Promise<ProfileRow[]> {
  const { data, error } = await supabase
    .from("follows")
    .select("following:profiles!follows_following_id_fkey(*)")
    .eq("follower_id", profileId)
    .overrideTypes<{ following: ProfileRow }[], { merge: false }>();
  if (error) throw error;
  return (data ?? []).map((row) => row.following);
}

export async function followUser(followerId: string, followingId: string): Promise<void> {
  const { error } = await supabase.from("follows").insert({ follower_id: followerId, following_id: followingId });
  if (error) throw error;
}

export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);
  if (error) throw error;
}
