import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";

import { Avatar } from "@/components/Avatar";
import { fetchConversations, type ConversationSummary } from "@/lib/chat";
import { timeAgo } from "@/lib/timeAgo";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";
import { avatarColorForId, colors, fonts, radii, spacing } from "@/theme/tokens";

export default function ChatInboxScreen() {
  const session = useAuthStore((s) => s.session);
  const showToast = useToastStore((s) => s.show);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const myId = session?.user.id;

  const load = useCallback(async () => {
    if (!myId) return;
    try {
      const data = await fetchConversations(myId);
      setConversations(data);
    } catch {
      showToast("Couldn't load messages", "⚠️");
    } finally {
      setLoading(false);
    }
  }, [myId, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Messages</Text>
        <View style={styles.backButton} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loading} />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.empty}>No conversations yet — message someone from the Friends tab.</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({ pathname: "/chat/[id]", params: { id: item.id, name: item.otherUser.name } })
              }
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <Avatar
                name={item.otherUser.name}
                color={avatarColorForId(item.otherUser.id)}
                imageUrl={item.otherUser.avatarUrl}
                size={48}
              />
              <View style={styles.rowMiddle}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.otherUser.name}
                </Text>
                <Text style={styles.preview} numberOfLines={1}>
                  {item.lastMessageBody ?? "Say hi 👋"}
                </Text>
              </View>
              <Text style={styles.time}>{timeAgo(item.lastMessageAt)}</Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: fonts.headingSemiBold,
    fontSize: 20,
    color: colors.textPrimary,
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
    marginTop: spacing.xxl,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowMiddle: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  name: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  preview: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 1,
  },
  time: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textMuted,
  },
});
