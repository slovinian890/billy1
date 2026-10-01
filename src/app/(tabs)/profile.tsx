import { useCallback, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";

import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { EditProfileSheet, type EditProfileSheetHandle } from "@/features/profile/EditProfileSheet";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { avatarColorForIndex } from "@/theme/tokens";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";
import { colors, fonts, radii, spacing } from "@/theme/tokens";

const GUEST_PROFILE = {
  name: "You",
  username: "guest",
  bio: null as string | null,
  avatar_url: null as string | null,
  favourite_food: null as string | null,
  favourite_drink: null as string | null,
};

export default function ProfileScreen() {
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const showToast = useToastStore((s) => s.show);

  const editSheetRef = useRef<EditProfileSheetHandle>(null);
  const [uploading, setUploading] = useState(false);

  const isGuest = !session;
  const display = profile ?? GUEST_PROFILE;
  const memberSince = profile
    ? new Date(profile.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : null;

  const handleChangeAvatar = useCallback(async () => {
    if (isGuest || !session) {
      showToast(isSupabaseConfigured ? "Sign in first" : "Add Supabase keys to enable accounts", "🔒");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
      const extension = asset.uri.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${session.user.id}/avatar.${extension}`;
      const arrayBuffer = await fetch(asset.uri).then((res) => res.arrayBuffer());

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, arrayBuffer, {
          contentType: asset.mimeType ?? "image/jpeg",
          upsert: true,
        });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const ok = await updateProfile({ avatar_url: `${data.publicUrl}?v=${Date.now()}` });
      if (ok) showToast("Photo updated", "📸");
    } catch {
      showToast("Couldn't upload photo", "⚠️");
    } finally {
      setUploading(false);
    }
  }, [isGuest, session, showToast, updateProfile]);

  const handleSignOut = useCallback(() => {
    signOut();
    showToast("Signed out", "👋");
  }, [signOut, showToast]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!isSupabaseConfigured && (
          <Card variant="soft" bordered={false} style={styles.noticeCard}>
            <Text style={styles.noticeText}>
              🔌 Running on local data — add your Supabase URL and anon key to enable real accounts.
            </Text>
          </Card>
        )}

        <View style={styles.hero}>
          <Pressable onPress={handleChangeAvatar} accessibilityRole="button" accessibilityLabel="Change photo">
            <Avatar
              name={display.name}
              color={avatarColorForIndex(0)}
              size={96}
              imageUrl={display.avatar_url}
              style={styles.heroAvatar}
            />
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={16} color={colors.white} />
            </View>
          </Pressable>
          {uploading && <Text style={styles.uploadingText}>Uploading…</Text>}

          <Text style={styles.name}>{display.name}</Text>
          <Text style={styles.username}>@{display.username}</Text>
          {display.bio ? <Text style={styles.bio}>{display.bio}</Text> : null}
        </View>

        {display.favourite_food || display.favourite_drink ? (
          <View style={styles.chipRow}>
            {display.favourite_food && (
              <Card variant="soft" bordered={false} style={styles.chip}>
                <Text style={styles.chipLabel}>LOVES TO EAT</Text>
                <Text style={styles.chipValue}>{display.favourite_food}</Text>
              </Card>
            )}
            {display.favourite_drink && (
              <Card variant="soft" bordered={false} style={styles.chip}>
                <Text style={styles.chipLabel}>LOVES TO DRINK</Text>
                <Text style={styles.chipValue}>{display.favourite_drink}</Text>
              </Card>
            )}
          </View>
        ) : !isGuest ? (
          <Pressable onPress={() => editSheetRef.current?.open()}>
            <Card variant="soft" bordered={false} style={styles.promptCard}>
              <Text style={styles.promptText}>🍽️ Tell us what you love to eat & drink</Text>
            </Card>
          </Pressable>
        ) : null}

        {!isGuest && (
          <Card variant="white" style={styles.actionsCard}>
            <SettingsRow
              icon="create-outline"
              label="Edit profile"
              onPress={() => editSheetRef.current?.open()}
            />
            <View style={styles.divider} />
            <SettingsRow icon="log-out-outline" label="Sign out" onPress={handleSignOut} destructive />
          </Card>
        )}

        {isGuest && isSupabaseConfigured && (
          <Card variant="soft" bordered={false} style={styles.promptCard}>
            <Text style={styles.promptText}>Sign in from the welcome screen to create your real profile.</Text>
          </Card>
        )}

        {session?.user.email && (
          <Text style={styles.footer}>
            {session.user.email}
            {memberSince ? ` · member since ${memberSince}` : ""}
          </Text>
        )}
      </ScrollView>

      <EditProfileSheet ref={editSheetRef} />
    </SafeAreaView>
  );
}

function SettingsRow({
  icon,
  label,
  onPress,
  destructive,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <Ionicons name={icon} size={20} color={destructive ? colors.bordo : colors.textPrimary} />
      <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  noticeCard: {
    marginBottom: spacing.lg,
  },
  noticeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  hero: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  heroAvatar: {
    borderWidth: 3,
    borderColor: colors.cardWhite,
  },
  cameraBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.background,
  },
  uploadingText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  name: {
    fontFamily: fonts.headingSemiBold,
    fontSize: 26,
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  username: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  bio: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14.5,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 21,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  chipRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  chip: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  chipLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 10.5,
    letterSpacing: 0.8,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  chipValue: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  promptCard: {
    marginBottom: spacing.lg,
    paddingVertical: spacing.lg,
  },
  promptText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  actionsCard: {
    padding: 0,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  rowPressed: {
    backgroundColor: colors.claimedRowFill,
  },
  rowLabel: {
    flex: 1,
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  rowLabelDestructive: {
    color: colors.bordo,
  },
  divider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginLeft: spacing.lg + 20 + spacing.md,
  },
  footer: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12.5,
    color: colors.textMuted,
    textAlign: "center",
  },
});
