import { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, fonts, radii, spacing } from "@/theme/tokens";
import { useToastStore } from "@/store/toastStore";

const AUTO_HIDE_MS = 2600;

/** Mount once near the root layout — every screen triggers it via useToastStore. */
export function Toast() {
  const message = useToastStore((s) => s.message);
  const icon = useToastStore((s) => s.icon);
  const hide = useToastStore((s) => s.hide);
  const insets = useSafeAreaInsets();

  const progress = useSharedValue(0);

  useEffect(() => {
    if (!message) return;

    progress.value = withSpring(1, { damping: 18, stiffness: 220 });
    const timer = setTimeout(() => {
      progress.value = withTiming(0, { duration: 200 });
      setTimeout(hide, 200);
    }, AUTO_HIDE_MS);

    return () => clearTimeout(timer);
  }, [message, progress, hide]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 12 }],
  }));

  if (!message) return null;

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[styles.container, { bottom: insets.bottom + spacing.xl }, animatedStyle]}
    >
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.darkSurface,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    maxWidth: "88%",
  },
  icon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  message: {
    color: colors.white,
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
  },
});
