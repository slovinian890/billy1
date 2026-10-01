import { StyleProp, Text, TextStyle } from "react-native";

import { formatMoney } from "@/lib/money";
import { colors, fonts } from "@/theme/tokens";
import type { Currency } from "@/types";

interface MoneyTextProps {
  cents: number;
  currency?: Currency;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
  /** Uses the heavier "receipt" mono weight instead of the regular one. */
  emphasis?: boolean;
  /**
   * "mono" (default) is for item prices and receipt-style numbers.
   * "heading" switches to Playfair Display for the big hero totals — the
   * peach card total, the running tab, "You owe €X.XX".
   */
  variant?: "mono" | "heading";
}

export function MoneyText({
  cents,
  currency = "EUR",
  size = 16,
  color = colors.textPrice,
  style,
  emphasis = false,
  variant = "mono",
}: MoneyTextProps) {
  const fontFamily =
    variant === "heading" ? fonts.headingBold : emphasis ? fonts.mono : fonts.monoRegular;

  return (
    <Text style={[{ fontFamily, fontSize: size, color }, style]}>{formatMoney(cents, currency)}</Text>
  );
}
