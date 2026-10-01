import { useCallback } from "react";
import { LayoutChangeEvent, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { colors, radii } from "@/theme/tokens";

interface ProgressBarProps {
  /** 0–1 */
  progress: number;
  height?: number;
  trackColor?: string;
  fillColor?: string;
  style?: StyleProp<ViewStyle>;
}

export function ProgressBar({
  progress,
  height = 8,
  trackColor = "rgba(155,81,64,0.15)",
  fillColor = colors.accent,
  style,
}: ProgressBarProps) {
  const clamped = Math.min(1, Math.max(0, progress));
  const trackWidth = useSharedValue(0);

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      trackWidth.value = event.nativeEvent.layout.width;
    },
    [trackWidth]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(trackWidth.value * clamped, { duration: 350 }),
  }));

  return (
    <View
      onLayout={handleLayout}
      style={[styles.track, { height, borderRadius: height / 2, backgroundColor: trackColor }, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <Animated.View
        style={[
          styles.fill,
          { height, borderRadius: height / 2, backgroundColor: fillColor },
          animatedStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: "100%",
    overflow: "hidden",
  },
  fill: {
    borderRadius: radii.pill,
  },
});
