import { PropsWithChildren } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { colors, radii, shadows } from "@/theme/tokens";

export type CardVariant = "white" | "peach" | "dark" | "soft" | "claimed";

interface CardProps extends PropsWithChildren {
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
  /** Adds the standard card border (skipped by default on dark/peach). */
  bordered?: boolean;
}

export function Card({ variant = "white", style, bordered, children }: CardProps) {
  const showBorder = bordered ?? variant === "white";

  return (
    <View
      style={[
        styles.base,
        backgroundFor(variant),
        showBorder && styles.border,
        variant === "white" && shadows.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

function backgroundFor(variant: CardVariant) {
  switch (variant) {
    case "white":
      return { backgroundColor: colors.cardWhite };
    case "peach":
      return { backgroundColor: colors.billHeader };
    case "dark":
      return { backgroundColor: colors.darkSurface };
    case "soft":
      return { backgroundColor: colors.softPanel };
    case "claimed":
      return { backgroundColor: colors.claimedRowFill };
  }
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.card,
    padding: 20,
  },
  border: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
});
