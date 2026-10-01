import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

import { EyebrowTitle } from "@/components/EyebrowTitle";
import { PlaceholderScreen } from "@/components/PlaceholderScreen";
import { CommentsSheet, type CommentsSheetHandle } from "@/features/memories/CommentsSheet";
import { CreateMemorySheet, type CreateMemorySheetHandle } from "@/features/memories/CreateMemorySheet";
import { PostCard } from "@/features/memories/PostCard";
import { isSupabaseConfigured } from "@/lib/supabase";
import { deleteMemory, fetchFeed, fetchProfilesByIds, toggleLike, type FeedPost } from "@/lib/social";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";
import { colors, fonts, radii, shadows, spacing } from "@/theme/tokens";

export default function MemoriesScreen() {
  const session = useAuthStore((s) => s.session);
  const showToast = useToastStore((s) => s.show);

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [namesById, setNamesById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const createSheetRef = useRef<CreateMemorySheetHandle>(null);
  const commentsSheetRef = useRef<CommentsSheetHandle>(null);

  const myId = session?.user.id;

  const load = useCallback(async () => {
    if (!myId) return;
    try {
      const feed = await fetchFeed(myId);
      setPosts(feed);

      const uniqueTaggedIds = Array.from(new Set(feed.flatMap((p) => p.taggedIds)));
      if (uniqueTaggedIds.length > 0) {
        const profiles = await fetchProfilesByIds(uniqueTaggedIds);
        setNamesById(Object.fromEntries(profiles.map((p) => [p.id, p.name])));
      }
    } catch (error) {
      console.error("[memories] load failed:", error);
      showToast("Couldn't load the feed", "⚠️");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [myId, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const handleToggleLike = useCallback(
    async (post: FeedPost) => {
      if (!myId) return;
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, likedByMe: !p.likedByMe, likeCount: p.likeCount + (p.likedByMe ? -1 : 1) }
            : p
        )
      );
      try {
        await toggleLike(post.id, myId, post.likedByMe);
      } catch {
        showToast("Couldn't update like", "⚠️");
        load();
      }
    },
    [myId, showToast, load]
  );

  const handleDelete = useCallback(
    (post: FeedPost) => {
      Alert.alert("Delete post?", "This can't be undone.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const previous = posts;
            setPosts((prev) => prev.filter((p) => p.id !== post.id));
            try {
              await deleteMemory(post.id, post.authorId);
              showToast("Post deleted", "🗑️");
            } catch {
              setPosts(previous);
              showToast("Couldn't delete post", "⚠️");
            }
          },
        },
      ]);
    },
    [posts, showToast]
  );

  const handleOpenComments = useCallback((postId: string) => {
    commentsSheetRef.current?.open(postId, () => {
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p)));
    });
  }, []);

  const renderedPosts = useMemo(
    () =>
      posts.map((post) => ({
        post,
        taggedNames: post.taggedIds.map((id) => namesById[id]).filter((n): n is string => Boolean(n)),
      })),
    [posts, namesById]
  );

  if (!isSupabaseConfigured || !session) {
    return (
      <PlaceholderScreen
        eyebrow="0 SAVED MOMENTS"
        title="Memories"
        emoji="✦"
        note={
          !isSupabaseConfigured
            ? "Add your Supabase keys to unlock the social feed."
            : "Sign in to see posts from people you follow — and share your own nights out."
        }
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <EyebrowTitle eyebrow="SHARED NIGHTS" title="Memories" />
        <Pressable
          onPress={() => createSheetRef.current?.open()}
          style={styles.newButton}
          accessibilityRole="button"
          accessibilityLabel="New post"
        >
          <Ionicons name="add" size={26} color={colors.white} />
        </Pressable>
      </View>

      <FlatList
        data={renderedPosts}
        keyExtractor={(item) => item.post.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No posts yet — be the first to share a night out.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <PostCard
            post={item.post}
            taggedNames={item.taggedNames}
            onToggleLike={() => handleToggleLike(item.post)}
            onOpenComments={() => handleOpenComments(item.post.id)}
            onDelete={item.post.authorId === myId ? () => handleDelete(item.post) : undefined}
          />
        )}
      />

      <CreateMemorySheet ref={createSheetRef} onPosted={load} />
      <CommentsSheet ref={commentsSheetRef} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  newButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.button,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  emptyWrap: {
    alignItems: "center",
    paddingTop: spacing.xxxl,
  },
  emptyText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
  },
});
