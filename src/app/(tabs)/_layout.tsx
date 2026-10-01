import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radii, shadows } from "@/theme/tokens";

type IoniconName = keyof typeof Ionicons.glyphMap;

/** Every tab icon sits in a coral bubble when focused — dark bar, bright active state. */
function TabIcon({ name, focused }: { name: IoniconName; focused: boolean }) {
  return (
    <View style={[styles.iconBubble, focused && styles.iconBubbleFocused]}>
      <Ionicons
        name={focused ? name : (`${name}-outline` as IoniconName)}
        size={20}
        color={focused ? colors.white : colors.textMuted}
      />
    </View>
  );
}

/** Scan is the primary action — always on, regardless of focus, to stand out. */
function ScanTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.iconBubble, styles.scanBubble, focused && styles.scanBubbleFocused]}>
      <Ionicons name="camera" size={20} color={colors.white} />
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.white,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: false,
        tabBarStyle: [styles.tabBar, shadows.nightBar, { height: 68 + insets.bottom, paddingBottom: insets.bottom }],
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Scan",
          tabBarAccessibilityLabel: "Scan a receipt",
          tabBarIcon: ({ focused }) => <ScanTabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="bills"
        options={{
          title: "Bills",
          tabBarIcon: ({ focused }) => <TabIcon name="receipt" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: "Friends",
          tabBarIcon: ({ focused }) => <TabIcon name="people" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="memories"
        options={{
          title: "Memories",
          tabBarIcon: ({ focused }) => <TabIcon name="images" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => <TabIcon name="person-circle" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.night,
    borderTopWidth: 0,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: 10,
  },
  tabBarItem: {
    paddingTop: 2,
  },
  iconBubble: {
    width: 38,
    height: 38,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBubbleFocused: {
    backgroundColor: colors.accent,
  },
  scanBubble: {
    backgroundColor: colors.bordo,
  },
  scanBubbleFocused: {
    backgroundColor: colors.accent,
  },
});
