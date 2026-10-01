import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";

import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";
import { colors, fonts, radii, spacing } from "@/theme/tokens";

export interface EditProfileSheetHandle {
  open: () => void;
  close: () => void;
}

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export const EditProfileSheet = forwardRef<EditProfileSheetHandle>(function EditProfileSheet(_props, ref) {
  const sheetRef = useRef<BottomSheetModal>(null);

  const profile = useAuthStore((s) => s.profile);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const authError = useAuthStore((s) => s.authError);
  const clearError = useAuthStore((s) => s.clearError);
  const showToast = useToastStore((s) => s.show);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [favouriteFood, setFavouriteFood] = useState("");
  const [favouriteDrink, setFavouriteDrink] = useState("");
  const [saving, setSaving] = useState(false);

  useImperativeHandle(ref, () => ({
    open: () => sheetRef.current?.present(),
    close: () => sheetRef.current?.dismiss(),
  }));

  // Reset the form to the latest saved profile each time it opens.
  const handleSheetChange = useCallback(
    (index: number) => {
      if (index >= 0 && profile) {
        setName(profile.name);
        setUsername(profile.username);
        setBio(profile.bio ?? "");
        setFavouriteFood(profile.favourite_food ?? "");
        setFavouriteDrink(profile.favourite_drink ?? "");
        clearError();
      }
    },
    [profile, clearError]
  );

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setUsername(profile.username);
      setBio(profile.bio ?? "");
      setFavouriteFood(profile.favourite_food ?? "");
      setFavouriteDrink(profile.favourite_drink ?? "");
    }
  }, [profile]);

  const usernameValid = USERNAME_PATTERN.test(username);
  const canSave = name.trim().length > 0 && usernameValid && !saving;

  const handleSave = useCallback(async () => {
    if (!canSave) return;
    setSaving(true);
    const ok = await updateProfile({
      name: name.trim(),
      username: username.trim(),
      bio: bio.trim() || null,
      favourite_food: favouriteFood.trim() || null,
      favourite_drink: favouriteDrink.trim() || null,
    });
    setSaving(false);
    if (ok) {
      showToast("Profile updated", "✨");
      sheetRef.current?.dismiss();
    }
  }, [canSave, name, username, bio, favouriteFood, favouriteDrink, updateProfile, showToast]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      enableDynamicSizing
      onChange={handleSheetChange}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />
      )}
    >
      <BottomSheetScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.eyebrow}>YOUR PROFILE</Text>
        <Text style={styles.title}>Edit profile</Text>

        <TextField label="Name" value={name} onChangeText={setName} autoCapitalize="words" style={styles.field} />
        <TextField
          label="Username"
          value={username}
          onChangeText={(text) => setUsername(text.toLowerCase().replace(/\s+/g, ""))}
          autoCapitalize="none"
          autoCorrect={false}
          error={username.length > 0 && !usernameValid ? "3–20 chars: a–z, 0–9, underscore" : undefined}
          style={styles.field}
        />
        <TextField
          label="Bio"
          value={bio}
          onChangeText={setBio}
          placeholder="Say something about yourself"
          multiline
          style={[styles.field, styles.bioField]}
        />
        <View style={styles.row}>
          <TextField
            label="Favourite food"
            value={favouriteFood}
            onChangeText={setFavouriteFood}
            placeholder="🍕 Pizza"
            style={[styles.field, styles.halfField]}
          />
          <TextField
            label="Favourite drink"
            value={favouriteDrink}
            onChangeText={setFavouriteDrink}
            placeholder="🍷 Red wine"
            style={[styles.field, styles.halfField]}
          />
        </View>

        {authError ? <Text style={styles.errorBanner}>{authError}</Text> : null}

        <Button title="Save" onPress={handleSave} disabled={!canSave} loading={saving} style={styles.saveButton} />
      </BottomSheetScrollView>
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
    marginBottom: spacing.xl,
  },
  field: {
    marginBottom: spacing.lg,
  },
  bioField: {
    minHeight: 80,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  halfField: {
    flex: 1,
  },
  errorBanner: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13.5,
    color: colors.bordo,
    marginBottom: spacing.lg,
  },
  saveButton: {
    marginBottom: spacing.sm,
  },
});
