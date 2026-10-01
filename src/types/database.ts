/**
 * Hand-written mirror of supabase/migrations/0001_init_schema.sql.
 * Keep in sync with that file until we wire up `supabase gen types`.
 */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          username: string;
          bio: string | null;
          avatar_url: string | null;
          favourite_food: string | null;
          favourite_drink: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          username: string;
          bio?: string | null;
          avatar_url?: string | null;
          favourite_food?: string | null;
          favourite_drink?: string | null;
        };
        Update: Partial<{
          name: string;
          username: string;
          bio: string | null;
          avatar_url: string | null;
          favourite_food: string | null;
          favourite_drink: string | null;
        }>;
        Relationships: [];
      };
      bills: {
        Row: {
          id: string;
          title: string;
          venue: string;
          location: string;
          date: string;
          created_by: string;
          status: "draft" | "active" | "completed";
          service_cents: number;
          tip_cents: number;
          tax_cents: number;
          discount_cents: number;
          receipt_total_cents: number;
          currency: "EUR" | "USD" | "GBP";
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["bills"]["Row"]> & {
          title: string;
          venue: string;
          location: string;
          date: string;
          created_by: string;
        };
        Update: Partial<Database["public"]["Tables"]["bills"]["Row"]>;
        Relationships: [];
      };
      bill_items: {
        Row: {
          id: string;
          bill_id: string;
          name: string;
          emoji: string;
          price_cents: number;
          position: number;
        };
        Insert: Partial<Database["public"]["Tables"]["bill_items"]["Row"]> & {
          bill_id: string;
          name: string;
          price_cents: number;
        };
        Update: Partial<Database["public"]["Tables"]["bill_items"]["Row"]>;
        Relationships: [];
      };
      participants: {
        Row: {
          id: string;
          bill_id: string;
          profile_id: string | null;
          guest_name: string | null;
          name: string;
          colour: string;
          is_done: boolean;
          payment_status: "not_paid" | "requested" | "paid" | "confirmed";
          covered_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["participants"]["Row"]> & {
          bill_id: string;
          name: string;
          colour: string;
        };
        Update: Partial<Database["public"]["Tables"]["participants"]["Row"]>;
        Relationships: [];
      };
      claims: {
        Row: {
          id: string;
          item_id: string;
          participant_id: string;
          share_cents: number;
        };
        Insert: Partial<Database["public"]["Tables"]["claims"]["Row"]> & {
          item_id: string;
          participant_id: string;
          share_cents: number;
        };
        Update: Partial<Database["public"]["Tables"]["claims"]["Row"]>;
        Relationships: [];
      };
      friendships: {
        Row: {
          user_id: string;
          friend_id: string;
          status: "pending" | "accepted";
          created_at: string;
        };
        Insert: {
          user_id: string;
          friend_id: string;
          status?: "pending" | "accepted";
        };
        Update: Partial<{ status: "pending" | "accepted" }>;
        Relationships: [];
      };
      memories: {
        Row: {
          id: string;
          bill_id: string | null;
          author_id: string;
          photo_url: string;
          caption: string | null;
          hashtags: string[];
          tagged_ids: string[];
          venue: string | null;
          amount_cents: number | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["memories"]["Row"]> & {
          author_id: string;
          photo_url: string;
        };
        Update: Partial<Database["public"]["Tables"]["memories"]["Row"]>;
        Relationships: [];
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      memory_likes: {
        Row: {
          memory_id: string;
          profile_id: string;
          created_at: string;
        };
        Insert: {
          memory_id: string;
          profile_id: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      memory_comments: {
        Row: {
          id: string;
          memory_id: string;
          author_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          memory_id: string;
          author_id: string;
          body: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          user_a_id: string;
          user_b_id: string;
          created_at: string;
          last_message_at: string;
        };
        Insert: {
          user_a_id: string;
          user_b_id: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          conversation_id: string;
          sender_id: string;
          body: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_or_create_conversation: {
        Args: { other_user_id: string };
        Returns: string;
      };
    };
  };
}

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type MemoryRow = Database["public"]["Tables"]["memories"]["Row"];
export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
export type ConversationRow = Database["public"]["Tables"]["conversations"]["Row"];
