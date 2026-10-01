import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { DMMono_400Regular, DMMono_500Medium } from "@expo-google-fonts/dm-mono";
import { useFonts } from "expo-font";

/**
 * Loads every weight referenced by `src/theme/tokens.ts`'s `fonts` map.
 * Returns `[fontsLoaded, error]`, same shape as the underlying `useFonts`.
 */
export function useAppFonts() {
  return useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    DMMono_400Regular,
    DMMono_500Medium,
  });
}
