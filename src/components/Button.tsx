import { useCallback } from "react";
import {
  ActivityIndicator,
  GestureResponderEvent,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { colors, fonts, radii, shadows, spacing } from "@/theme/tokens";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "dark";

interface ButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  /** Fires a light haptic on press. Defaults to true for primary/dark buttons. */
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  haptic,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, { damping: 16, stiffness: 300 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 16, stiffness: 300 });
  }, [scale]);

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      const shouldHaptic = haptic ?? (variant === "primary" || variant === "dark");
      if (shouldHaptic) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPress(event);
    },
    [haptic, onPress, variant]
  );

  const isDisabled = disabled || loading;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        styles.base,
        variantStyles[variant],
        isDisabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColorFor(variant)} />
      ) : (
        <Text style={[styles.label, { color: textColorFor(variant) }]}>{title}</Text>
      )}
    </AnimatedPressable>
  );
}

function textColorFor(variant: ButtonVariant): string {
  switch (variant) {
    case "primary":
    case "dark":
      return colors.white;
    case "secondary":
      return colors.textPrimary;
    case "ghost":
      return colors.accent;
  }
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    flexDirection: "row",
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
  },
  disabled: {
    opacity: 0.45,
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.accent,
    ...shadows.button,
  },
  secondary: {
    backgroundColor: colors.softPanel,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  dark: {
    backgroundColor: colors.darkSurface,
  },
});
