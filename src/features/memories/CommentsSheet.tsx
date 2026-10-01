import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal } from "@gorhom/bottom-sheet";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Avatar } from "@/components/Avatar";
import { TextField } from "@/components/TextField";
import { addComment, fetchComments, type Comment } from "@/lib/social";
import { timeAgo } from "@/lib/timeAgo";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";
import { avatarColorForId, colors, fonts, radii, spacing } from "@/theme/tokens";

export interface CommentsSheetHandle {
  open: (memoryId: string, onCommentAdded?: () => void) => void;
  close: () => void;
}

export const CommentsSheet = forwardRef<CommentsSheetHandle>(function CommentsSheet(_props, ref) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const profile = useAuthStore((s) => s.profile);
  const showToast = useToastStore((s) => s.show);

  const [memoryId, setMemoryId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const onCommentAddedRef = useRef<(() => void) | undefined>(undefined);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const data = await fetchComments(id);
      setComments(data);
    } catch {
      showToast("Couldn't load comments", "⚠️");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useImperativeHandle(ref, () => ({
    open: (id, onCommentAdded) => {
      setMemoryId(id);
      onCommentAddedRef.current = onCommentAdded;
      setDraft("");
      sheetRef.current?.present();
      load(id);
    },
    close: () => sheetRef.current?.dismiss(),
  }));

  const handleSend = useCallback(async () => {
    const body = draft.trim();
    if (!body || !memoryId || !profile || sending) return;
    setSending(true);
    try {
      await addComment(memoryId, profile.id, body);
      setDraft("");
      await load(memoryId);
      onCommentAddedRef.current?.();
    } catch {
      showToast("Couldn't post comment", "⚠️");
    } finally {
      setSending(false);
    }
  }, [draft, memoryId, profile, sending, load, showToast]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={["65%"]}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />
      )}
    >
      <Text style={styles.title}>Comments</Text>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loading} />
      ) : (
        <BottomSheetFlatList
          data={comments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.empty}>No comments yet — be the first.</Text>}
          renderItem={({ item }) => (
            <View style={styles.commentRow}>
              <Avatar
                name={item.author.name}
                color={avatarColorForId(item.author.id)}
                imageUrl={item.author.avatarUrl}
                size={32}
              />
              <View style={styles.commentBody}>
                <Text style={styles.commentMeta}>
                  <Text style={styles.commentName}>{item.author.name}</Text> · {timeAgo(item.createdAt)}
                </Text>
                <Text style={styles.commentText}>{item.body}</Text>
              </View>
            </View>
          )}
        />
      )}

      <View style={styles.composer}>
        <TextField
          value={draft}
          onChangeText={setDraft}
          placeholder="Add a comment…"
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
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
  },
  handleIndicator: {
    backgroundColor: colors.cardBorder,
    width: 44,
  },
  title: {
    fontFamily: fonts.headingSemiBold,
    fontSize: 20,
    color: colors.textPrimary,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  loading: {
    marginTop: spacing.xxl,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  empty: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.xl,
  },
  commentRow: {
    flexDirection: "row",
    marginBottom: spacing.md,
  },
  commentBody: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  commentMeta: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 2,
  },
  commentName: {
    fontFamily: fonts.bodyBold,
    color: colors.textPrimary,
  },
  commentText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 19,
  },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
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
