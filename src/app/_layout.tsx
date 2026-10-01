import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";

import { Toast } from "@/components/Toast";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { colors } from "@/theme/tokens";
import { useAppFonts } from "@/theme/useAppFonts";

SplashScreen.preventAutoHideAsync().catch(() => {
  // no-op — splash may already be hidden in some environments (e.g. web)
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useAppFonts();
  const authInitializing = useAuthStore((s) => s.initializing);
  const session = useAuthStore((s) => s.session);

  const ready = (fontsLoaded || fontError) && !authInitializing;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  // Without real Supabase credentials there's no way to sign in, so the app
  // stays open on its mock data — same as before Phase 3 landed.
  const isAuthed = Boolean(session) || !isSupabaseConfigured;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: styles.root }}>
            <Stack.Protected guard={isAuthed}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="chat" options={{ presentation: "card" }} />
            </Stack.Protected>
            <Stack.Protected guard={!isAuthed}>
              <Stack.Screen name="(auth)" />
            </Stack.Protected>
          </Stack>
          <Toast />
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
