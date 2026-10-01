import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";

import { Button } from "@/components/Button";
import { EyebrowTitle } from "@/components/EyebrowTitle";
import { PlaceholderScreen } from "@/components/PlaceholderScreen";
import { TextField } from "@/components/TextField";
import { UserRow } from "@/components/UserRow";
import { getOrCreateConversation } from "@/lib/chat";
import {
  fetchFollowers,
  fetchFollowing,
  fetchFollowingIds,
  followUser,
  searchProfiles,
  unfollowUser,
} from "@/lib/social";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";
import { avatarColorForId, colors, fonts, radii, spacing } from "@/theme/tokens";
import type { ProfileRow } from "@/types/database";

type ListTab = "following" | "followers";

export default function FriendsScreen() {
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const showToast = useToastStore((s) => s.show);

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProfileRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [tab, setTab] = useState<ListTab>("following");
  const [following, setFollowing] = useState<ProfileRow[]>([]);
  const [followers, setFollowers] = useState<ProfileRow[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  const myId = profile?.id;

  const loadLists = useCallback(async () => {
    if (!myId) return;
    try {
      const [followingList, followerList, idSet] = await Promise.all([
        fetchFollowing(myId),
        fetchFollowers(myId),
        fetchFollowingIds(myId),
      ]);
      setFollowing(followingList);
      setFollowers(followerList);
      setFollowingIds(idSet);
    } catch {
      showToast("Couldn't load your people", "⚠️");
    } finally {
      setLoading(false);
    }
  }, [myId, showToast]);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  useEffect(() => {
    if (!myId || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchProfiles(query, myId);
        if (!cancelled) setSearchResults(results);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, myId]);

  const toggleFollow = useCallback(
    async (target: ProfileRow) => {
      if (!myId) return;
      const alreadyFollowing = followingIds.has(target.id);
      setBusyIds((prev) => new Set(prev).add(target.id));
      setFollowingIds((prev) => {
        const next = new Set(prev);
        if (alreadyFollowing) next.delete(target.id);
        else next.add(target.id);
        return next;
      });
      try {
        if (alreadyFollowing) await unfollowUser(myId, target.id);
        else await followUser(myId, target.id);
        loadLists();
      } catch {
        showToast("Something went wrong", "⚠️");
        loadLists();
      } finally {
        setBusyIds((prev) => {
          const next = new Set(prev);
          next.delete(target.id);
          return next;
        });
      }
    },
    [myId, followingIds, showToast, loadLists]
  );

  const handleMessage = useCallback(
    async (target: ProfileRow) => {
      try {
        const conversationId = await getOrCreateConversation(target.id);
        router.push({ pathname: "/chat/[id]", params: { id: conversationId, name: target.name } });
      } catch {
        showToast("Couldn't open chat", "⚠️");
      }
    },
    [showToast]
  );

  if (!isSupabaseConfigured || !session || !profile) {
    return (
      <PlaceholderScreen
        eyebrow="YOUR PEOPLE"
        title="Friends"
        emoji="🤝"
        note={
          !isSupabaseConfigured
            ? "Add your Supabase keys to find and follow people."
            : "Sign in to follow people and message them."
        }
      />
    );
  }

  const isSearching = query.trim().length >= 2;
  const listData = isSearching ? searchResults : tab === "following" ? following : followers;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <EyebrowTitle eyebrow="YOUR PEOPLE" title="Friends" />
        <Pressable
          onPress={() => router.push("/chat")}
          style={styles.inboxButton}
          accessibilityRole="button"
          accessibilityLabel="Messages"
        >
          <Ionicons name="chatbubbles-outline" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      <TextField
        value={query}
        onChangeText={setQuery}
        placeholder="Search by name or @username"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.search}
      />

      {!isSearching && (
        <View style={styles.tabRow}>
          <TabButton
            label={`Following (${following.length})`}
            active={tab === "following"}
            onPress={() => setTab("following")}
          />
          <TabButton
            label={`Followers (${followers.length})`}
            active={tab === "followers"}
            onPress={() => setTab("followers")}
          />
        </View>
      )}

      {loading && listData.length === 0 ? (
        <ActivityIndicator color={colors.accent} style={styles.loading} />
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {isSearching
                ? searching
                  ? "Searching…"
                  : "No one found."
                : tab === "following"
                  ? "You're not following anyone yet — search above to find people."
                  : "No followers yet."}
            </Text>
          }
          renderItem={({ item }) => (
            <UserRow
              name={item.name}
              username={item.username}
              avatarUrl={item.avatar_url}
              color={avatarColorForId(item.id)}
            >
              <View style={styles.rowActions}>
                <Pressable
                  onPress={() => handleMessage(item)}
                  style={styles.iconButton}
                  accessibilityRole="button"
                  accessibilityLabel={`Message ${item.name}`}
                >
                  <Ionicons name="chatbubble-outline" size={18} color={colors.textPrimary} />
                </Pressable>
                <Button
                  title={followingIds.has(item.id) ? "Following" : "Follow"}
                  variant={followingIds.has(item.id) ? "secondary" : "primary"}
                  onPress={() => toggleFollow(item)}
                  loading={busyIds.has(item.id)}
                  style={styles.followButton}
                />
              </View>
            </UserRow>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.tabButton, active && styles.tabButtonActive]}>
      <Text style={[styles.tabButtonLabel, active && styles.tabButtonLabelActive]}>{label}</Text>
    </Pressable>
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
  inboxButton: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.cardWhite,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  search: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  tabRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  tabButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: colors.softPanel,
  },
  tabButtonActive: {
    backgroundColor: colors.night,
  },
  tabButtonLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12.5,
    color: colors.textSecondary,
  },
  tabButtonLabelActive: {
    color: colors.white,
  },
  loading: {
    marginTop: spacing.xxl,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  empty: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.softPanel,
    alignItems: "center",
    justifyContent: "center",
  },
  followButton: {
    minHeight: 36,
    paddingHorizontal: spacing.lg,
  },
});
