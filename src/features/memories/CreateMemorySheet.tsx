import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";

import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { UserRow } from "@/components/UserRow";
import { createMemory, searchProfiles, uploadMemoryPhoto, type FeedAuthor } from "@/lib/social";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";
import { avatarColorForId, colors, fonts, radii, spacing } from "@/theme/tokens";
import type { ProfileRow } from "@/types/database";

export interface CreateMemorySheetHandle {
  open: () => void;
  close: () => void;
}

export const CreateMemorySheet = forwardRef<CreateMemorySheetHandle, { onPosted: () => void }>(
  function CreateMemorySheet({ onPosted }, ref) {
    const sheetRef = useRef<BottomSheetModal>(null);
    const profile = useAuthStore((s) => s.profile);
    const showToast = useToastStore((s) => s.show);

    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [venue, setVenue] = useState("");
    const [amount, setAmount] = useState("");
    const [caption, setCaption] = useState("");
    const [tagQuery, setTagQuery] = useState("");
    const [tagResults, setTagResults] = useState<ProfileRow[]>([]);
    const [tagged, setTagged] = useState<FeedAuthor[]>([]);
    const [posting, setPosting] = useState(false);

    const reset = useCallback(() => {
      setPhotoUri(null);
      setVenue("");
      setAmount("");
      setCaption("");
      setTagQuery("");
      setTagResults([]);
      setTagged([]);
    }, []);

    useImperativeHandle(ref, () => ({
      open: () => {
        reset();
        sheetRef.current?.present();
      },
      close: () => sheetRef.current?.dismiss(),
    }));

    const handlePickPhoto = useCallback(async () => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
    }, []);

    const handleTagSearch = useCallback(
      async (text: string) => {
        setTagQuery(text);
        if (!profile || text.trim().length < 2) {
          setTagResults([]);
          return;
        }
        try {
          const results = await searchProfiles(text, profile.id);
          setTagResults(results.filter((r) => !tagged.some((t) => t.id === r.id)));
        } catch {
          setTagResults([]);
        }
      },
      [profile, tagged]
    );

    const addTag = useCallback((p: ProfileRow) => {
      setTagged((prev) => [...prev, { id: p.id, name: p.name, username: p.username, avatarUrl: p.avatar_url }]);
      setTagQuery("");
      setTagResults([]);
    }, []);

    const removeTag = useCallback((id: string) => {
      setTagged((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const canPost = Boolean(photoUri) && !posting;

    const handlePost = useCallback(async () => {
      if (!photoUri || !profile || posting) return;
      setPosting(true);
      try {
        const photoUrl = await uploadMemoryPhoto(profile.id, photoUri);
        const trimmedAmount = amount.trim().replace(",", ".");
        const amountCents = trimmedAmount ? Math.round(parseFloat(trimmedAmount) * 100) : undefined;
        await createMemory({
          authorId: profile.id,
          photoUrl,
          caption: caption.trim() || undefined,
          venue: venue.trim() || undefined,
          amountCents: Number.isFinite(amountCents) ? amountCents : undefined,
          taggedIds: tagged.map((t) => t.id),
        });
        showToast("Posted!", "✨");
        sheetRef.current?.dismiss();
        onPosted();
      } catch {
        showToast("Couldn't post — try again", "⚠️");
      } finally {
        setPosting(false);
      }
    }, [photoUri, profile, posting, amount, caption, venue, tagged, showToast, onPosted]);

    return (
      <BottomSheetModal
        ref={sheetRef}
        enableDynamicSizing
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />
        )}
      >
        <BottomSheetScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <Text style={styles.eyebrow}>SHARE THE NIGHT</Text>
          <Text style={styles.title}>New post</Text>

          <Pressable onPress={handlePickPhoto} style={styles.photoPicker}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="image-outline" size={28} color={colors.textMuted} />
                <Text style={styles.photoPlaceholderText}>Tap to add a photo</Text>
              </View>
            )}
          </Pressable>

          <View style={styles.row}>
            <TextField
              label="Where?"
              value={venue}
              onChangeText={setVenue}
              placeholder="Luigi's"
              style={[styles.field, styles.halfField]}
            />
            <TextField
              label="How much? (flex)"
              value={amount}
              onChangeText={setAmount}
              placeholder="49.00"
              keyboardType="decimal-pad"
              style={[styles.field, styles.halfField]}
            />
          </View>

          <TextField
            label="Caption"
            value={caption}
            onChangeText={setCaption}
            placeholder="Best pizza in town 🍕"
            multiline
            style={styles.field}
          />

          <TextField
            label="Tag people"
            value={tagQuery}
            onChangeText={handleTagSearch}
            placeholder="Search by username"
            autoCapitalize="none"
            style={styles.field}
          />

          {tagged.length > 0 && (
            <View style={styles.tagChips}>
              {tagged.map((t) => (
                <Pressable key={t.id} onPress={() => removeTag(t.id)} style={styles.tagChip}>
                  <Text style={styles.tagChipText}>{t.name} ✕</Text>
                </Pressable>
              ))}
            </View>
          )}

          {tagResults.map((p) => (
            <Pressable key={p.id} onPress={() => addTag(p)}>
              <UserRow name={p.name} username={p.username} avatarUrl={p.avatar_url} color={avatarColorForId(p.id)} />
            </Pressable>
          ))}

          <Button title="Post" onPress={handlePost} disabled={!canPost} loading={posting} style={styles.postButton} />
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  }
);

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
  content: {
    paddingHorizontal: spacing.xl,
  },
  contentContainer: {
    paddingBottom: spacing.xxl,
  },
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: colors.textMuted,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  title: {
    fontFamily: fonts.headingSemiBold,
    fontSize: 24,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  photoPicker: {
    borderRadius: radii.lg,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  photoPreview: {
    width: "100%",
    aspectRatio: 1,
  },
  photoPlaceholder: {
    width: "100%",
    aspectRatio: 1.6,
    backgroundColor: colors.softPanel,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  photoPlaceholderText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textMuted,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  field: {
    marginBottom: spacing.lg,
  },
  halfField: {
    flex: 1,
  },
  tagChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  tagChip: {
    backgroundColor: colors.softPanel,
    borderRadius: radii.pill,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
  },
  tagChipText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12.5,
    color: colors.textPrimary,
  },
  postButton: {
    marginTop: spacing.sm,
  },
});
