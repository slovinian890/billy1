/**
 * Design tokens for Tab. Never hard-code a colour, radius, or font name in a
 * component — import it from here so the whole app stays one system.
 *
 * Palette matches billssplitter.com's brand colours — orange (coral), a deep
 * bordeaux/wine red, and near-black "night" greys — pulled directly from
 * their published stylesheet rather than eyeballed.
 */

export const colors = {
  background: "#fbf7f1",

  textPrimary: "#1a1412",
  textMuted: "#a89d95",
  textSecondary: "#7b6f68",
  textPrice: "#7a6e69",

  accent: "#ff5a49",
  accentPressed: "#e6412f",
  accentSoft: "#ffb4a3",
  accentHighlightBorder: "#ff9b85",
  accentHighlightFill: "#fff5f3",

  /** Bordeaux/wine red — the app's second brand colour alongside orange. */
  bordo: "#a12b48",
  bordoSoft: "#c95a75",
  bordoHighlightFill: "#f6e9ec",

  billHeader: "#ffdccd",
  billHeaderLabel: "#9b5140",

  /** Near-black brand dark, used for the tab bar and "dark" buttons. */
  night: "#120e0d",
  nightSecondary: "#1d1715",
  darkSurface: "#120e0d",

  cardWhite: "#ffffff",
  cardBorder: "#e7dccf",
  claimedRowFill: "#f3ebe1",
  softPanel: "#f7efe4",

  success: "#119c8c",

  scannerCorner: "#e6a52a",
  cameraSurround: "#1a1412",

  white: "#ffffff",
  black: "#000000",
} as const;

/** Assigned in order to each person on a bill — "You" is always coral. */
export const avatarColors = ["#ff5a49", "#6d55d8", "#119c8c", "#e6a52a"] as const;

export function avatarColorForIndex(index: number): string {
  return avatarColors[index % avatarColors.length];
}

/** Deterministic colour for a profile that has no fixed seat order — hashes its id. */
export function avatarColorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return avatarColorForIndex(Math.abs(hash));
}

export const radii = {
  sm: 12,
  md: 18,
  lg: 22,
  xl: 26,
  card: 28,
  sheet: 32,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
} as const;

/**
 * Family keys line up 1:1 with what `src/theme/fonts.ts` loads via
 * useFonts — use these, never a raw string, so a typo becomes a type error.
 *
 * Note: the real DM Mono google-font family only ships Light/Regular/Medium
 * weights (no 700 Bold export exists), so "DM Mono 700" from the design
 * spec is approximated with its heaviest available weight, Medium (500).
 */
export const fonts = {
  headingRegular: "PlayfairDisplay_400Regular",
  headingMedium: "PlayfairDisplay_500Medium",
  headingSemiBold: "PlayfairDisplay_600SemiBold",
  headingBold: "PlayfairDisplay_700Bold",

  bodyMedium: "PlusJakartaSans_500Medium",
  bodySemiBold: "PlusJakartaSans_600SemiBold",
  bodyBold: "PlusJakartaSans_700Bold",

  mono: "DMMono_500Medium",
  monoRegular: "DMMono_400Regular",
} as const;

export const shadows = {
  card: {
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  button: {
    shadowColor: colors.accentPressed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  sheet: {
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  nightBar: {
    shadowColor: colors.night,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 10,
  },
} as const;

/** Orange → bordeaux → near-black — the hero gradient used on standout cards. */
export const gradients = {
  hero: [colors.accent, colors.bordo, colors.night] as const,
  heroSoft: [colors.accentSoft, colors.bordoSoft] as const,
} as const;
