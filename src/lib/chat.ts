import type { RealtimeChannel } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

export interface ConversationSummary {
  id: string;
  otherUser: {
    id: string;
    name: string;
    username: string;
    avatarUrl: string | null;
  };
  lastMessageAt: string;
  lastMessageBody: string | null;
}

interface RawConversationRow {
  id: string;
  user_a_id: string;
  user_b_id: string;
  last_message_at: string;
  user_a: { id: string; name: string; username: string; avatar_url: string | null } | null;
  user_b: { id: string; name: string; username: string; avatar_url: string | null } | null;
}

/** Looks up (or creates) the 1:1 conversation with another user. */
export async function getOrCreateConversation(otherUserId: string): Promise<string> {
  const { data, error } = await supabase.rpc("get_or_create_conversation", { other_user_id: otherUserId });
  if (error) throw error;
  return data;
}

export async function fetchConversations(myId: string): Promise<ConversationSummary[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select(
      "id, user_a_id, user_b_id, last_message_at, user_a:profiles!conversations_user_a_id_fkey(id, name, username, avatar_url), user_b:profiles!conversations_user_b_id_fkey(id, name, username, avatar_url)"
    )
    .or(`user_a_id.eq.${myId},user_b_id.eq.${myId}`)
    .order("last_message_at", { ascending: false })
    .overrideTypes<RawConversationRow[], { merge: false }>();
  if (error) throw error;

  const rows = data ?? [];
  const conversationIds = rows.map((r) => r.id);
  const lastBodies = await fetchLastMessageBodies(conversationIds);

  return rows
    .map((row) => {
      const other = row.user_a_id === myId ? row.user_b : row.user_a;
      if (!other) return null;
      return {
        id: row.id,
        otherUser: {
          id: other.id,
          name: other.name,
          username: other.username,
          avatarUrl: other.avatar_url,
        },
        lastMessageAt: row.last_message_at,
        lastMessageBody: lastBodies.get(row.id) ?? null,
      };
    })
    .filter((row): row is ConversationSummary => row !== null);
}

async function fetchLastMessageBodies(conversationIds: string[]): Promise<Map<string, string>> {
  if (conversationIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from("messages")
    .select("conversation_id, body, created_at")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const map = new Map<string, string>();
  for (const row of data ?? []) {
    if (!map.has(row.conversation_id)) map.set(row.conversation_id, row.body);
  }
  return map;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export async function fetchMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, body, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
  }));
}

export async function sendMessage(conversationId: string, senderId: string, body: string): Promise<void> {
  const { error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, body });
  if (error) throw error;
}

/** Subscribes to new messages in a conversation. Call the returned function to unsubscribe. */
export function subscribeToMessages(
  conversationId: string,
  onInsert: (message: ChatMessage) => void
): () => void {
  const channel: RealtimeChannel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
      (payload) => {
        const row = payload.new as {
          id: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          created_at: string;
        };
        onInsert({
          id: row.id,
          conversationId: row.conversation_id,
          senderId: row.sender_id,
          body: row.body,
          createdAt: row.created_at,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
