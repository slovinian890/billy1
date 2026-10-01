import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

import { colors, fonts } from "@/theme/tokens";
import { Avatar } from "./Avatar";

export interface AvatarStackPerson {
  id: string;
  name: string;
  color: string;
}

interface AvatarStackProps {
  people: AvatarStackPerson[];
  size?: number;
  /** How many avatars to show before collapsing the rest into a "+N" bubble. */
  max?: number;
  style?: StyleProp<ViewStyle>;
}

/** Overlapping avatars — used on rows split between several people. */
export function AvatarStack({ people, size = 32, max = 4, style }: AvatarStackProps) {
  const visible = people.slice(0, max);
  const overflow = people.length - visible.length;
  const overlap = size * 0.4;

  return (
    <View style={[styles.row, style]}>
      {visible.map((person, index) => (
        <Avatar
          key={person.id}
          name={person.name}
          color={person.color}
          size={size}
          bordered
          style={{ marginLeft: index === 0 ? 0 : -overlap, zIndex: visible.length - index }}
        />
      ))}
      {overflow > 0 && (
        <View
          style={[
            styles.overflow,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: -overlap,
            },
          ]}
        >
          <Text style={[styles.overflowLabel, { fontSize: size * 0.34 }]}>+{overflow}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  overflow: {
    backgroundColor: colors.textMuted,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.background,
  },
  overflowLabel: {
    color: colors.white,
    fontFamily: fonts.bodyBold,
  },
});
