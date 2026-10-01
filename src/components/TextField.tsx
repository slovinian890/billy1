import { forwardRef } from "react";
import { StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from "react-native";

import { colors, fonts, radii, spacing } from "@/theme/tokens";

interface TextFieldProps extends Omit<TextInputProps, "style"> {
  label?: string;
  error?: string;
  /** Style for the outer wrapper (label + input + error) — not the TextInput itself. */
  style?: StyleProp<ViewStyle>;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, style, ...inputProps },
  ref
) {
  return (
    <View style={style}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          inputProps.multiline && styles.inputMultiline,
          Boolean(error) && styles.inputError,
        ]}
        textAlignVertical={inputProps.multiline ? "top" : "center"}
        {...inputProps}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  input: {
    minHeight: 52,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.cardWhite,
    paddingHorizontal: spacing.lg,
    fontFamily: fonts.bodyMedium,
    fontSize: 15.5,
    color: colors.textPrimary,
  },
  inputMultiline: {
    minHeight: 90,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  inputError: {
    borderColor: colors.bordo,
  },
  error: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12.5,
    color: colors.bordo,
    marginTop: spacing.xs,
  },
});
