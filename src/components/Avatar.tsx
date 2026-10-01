import { Image } from "expo-image";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

import { colors, fonts } from "@/theme/tokens";

interface AvatarProps {
  name: string;
  color: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  /** Draws the cream border used when avatars overlap in a stack. */
  bordered?: boolean;
  /** Shows a photo instead of initials when set. */
  imageUrl?: string | null;
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name, color, size = 36, style, bordered = false, imageUrl }: AvatarProps) {
  return (
    <View
      accessibilityLabel={name}
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          borderWidth: bordered ? 2 : 0,
          borderColor: colors.background,
          overflow: "hidden",
        },
        style,
      ]}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initialsFor(name)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: colors.white,
    fontFamily: fonts.bodyBold,
  },
});
