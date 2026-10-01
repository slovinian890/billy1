import { Stack } from "expo-router";

// Avoids two sibling route groups ((tabs) and (auth)) both claiming the
// bare "/" path via their own index.tsx — sign-in is the default screen
// here without being named "index".
export const unstable_settings = {
  initialRouteName: "sign-in",
};

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
