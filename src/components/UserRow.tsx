import { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, fonts, spacing } from "@/theme/tokens";
import { Avatar } from "./Avatar";

interface UserRowProps extends PropsWithChildren {
  name: string;
  username: string;
  avatarUrl?: string | null;
  color: string;
}

/** Avatar + name/@username row — search results, followers, following, conversations. */
export function UserRow({ name, username, avatarUrl, color, children }: UserRowProps) {
  return (
    <View style={styles.row}>
      <Avatar name={name} color={color} imageUrl={avatarUrl} size={44} />
      <View style={styles.middle}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.username} numberOfLines={1}>
          @{username}
        </Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  middle: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  name: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  username: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: 1,
  },
});
