import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";

import { TextField } from "@/components/TextField";
import { fetchMessages, sendMessage, subscribeToMessages, type ChatMessage } from "@/lib/chat";
import { timeAgo } from "@/lib/timeAgo";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";
import { colors, fonts, radii, spacing } from "@/theme/tokens";

export default function ChatThreadScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const session = useAuthStore((s) => s.session);
  const showToast = useToastStore((s) => s.show);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const myId = session?.user.id;

  useEffect(() => {
    if (!id) return;
    fetchMessages(id).then(setMessages).catch(() => showToast("Couldn't load messages", "⚠️"));

    const unsubscribe = subscribeToMessages(id, (message) => {
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    });
    return unsubscribe;
  }, [id, showToast]);

  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    const body = draft.trim();
    if (!body || !id || !myId || sending) return;
    setDraft("");
    setSending(true);
    try {
      await sendMessage(id, myId, body);
    } catch {
      showToast("Message didn't send", "⚠️");
    } finally {
      setSending(false);
    }
  }, [draft, id, myId, sending, showToast]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title} numberOfLines={1}>
            {name ?? "Chat"}
          </Text>
          <View style={styles.backButton} />
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const isMine = item.senderId === myId;
            return (
              <View style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
                <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{item.body}</Text>
                </View>
                <Text style={styles.bubbleTime}>{timeAgo(item.createdAt)}</Text>
              </View>
            );
          }}
        />

        <View style={styles.composer}>
          <TextField
            value={draft}
            onChangeText={setDraft}
            placeholder="Message…"
            style={styles.composerField}
            onSubmitEditing={handleSend}
          />
          <Pressable
            onPress={handleSend}
            disabled={!draft.trim() || sending}
            style={[styles.sendButton, (!draft.trim() || sending) && styles.sendButtonDisabled]}
          >
            <Ionicons name="send" size={18} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
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
    flex: 1,
    textAlign: "center",
    fontFamily: fonts.headingSemiBold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  bubbleRow: {
    marginBottom: spacing.sm,
    maxWidth: "78%",
  },
  bubbleRowMine: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  bubbleRowTheirs: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  bubble: {
    borderRadius: radii.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  bubbleMine: {
    backgroundColor: colors.accent,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: colors.cardWhite,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14.5,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  bubbleTextMine: {
    color: colors.white,
  },
  bubbleTime: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 2,
    marginHorizontal: spacing.xs,
  },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  composerField: {
    flex: 1,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
