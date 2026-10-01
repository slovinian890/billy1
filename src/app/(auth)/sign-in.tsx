import { useCallback, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { EyebrowTitle } from "@/components/EyebrowTitle";
import { TextField } from "@/components/TextField";
import { useAuthStore } from "@/store/authStore";
import { colors, fonts, spacing } from "@/theme/tokens";

export default function SignInScreen() {
  const signIn = useAuthStore((s) => s.signIn);
  const authError = useAuthStore((s) => s.authError);
  const clearError = useAuthStore((s) => s.clearError);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = email.trim().length > 3 && password.length >= 6 && !loading;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setLoading(true);
    const ok = await signIn(email.trim(), password);
    setLoading(false);
    if (ok) router.replace("/(tabs)");
  }, [canSubmit, email, password, signIn]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.logo}>Tab</Text>
          <EyebrowTitle eyebrow="WELCOME BACK" title="Sign in" style={styles.header} />

          <TextField
            label="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (authError) clearError();
            }}
            placeholder="you@example.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            style={styles.field}
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (authError) clearError();
            }}
            placeholder="••••••••"
            secureTextEntry
            textContentType="password"
            style={styles.field}
          />

          {authError ? <Text style={styles.errorBanner}>{authError}</Text> : null}

          <Button
            title="Sign in"
            onPress={handleSubmit}
            disabled={!canSubmit}
            loading={loading}
            style={styles.submit}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>New here? </Text>
            <Link href="/(auth)/sign-up" replace>
              <Text style={styles.footerLink}>Create an account</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  logo: {
    fontFamily: fonts.headingBold,
    fontSize: 22,
    color: colors.accent,
    marginBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.xxl,
  },
  field: {
    marginBottom: spacing.lg,
  },
  errorBanner: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13.5,
    color: colors.bordo,
    marginBottom: spacing.lg,
  },
  submit: {
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.xxl,
  },
  footerText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  footerLink: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.accent,
  },
});
