import { useCallback, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EyebrowTitle } from "@/components/EyebrowTitle";
import { TextField } from "@/components/TextField";
import { useAuthStore } from "@/store/authStore";
import { colors, fonts, spacing } from "@/theme/tokens";

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export default function SignUpScreen() {
  const signUp = useAuthStore((s) => s.signUp);
  const authError = useAuthStore((s) => s.authError);
  const clearError = useAuthStore((s) => s.clearError);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const usernameValid = USERNAME_PATTERN.test(username);
  const canSubmit =
    name.trim().length > 0 && usernameValid && email.trim().length > 3 && password.length >= 6 && !loading;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setLoading(true);
    const result = await signUp(email.trim(), password, name.trim(), username.trim());
    setLoading(false);
    if (result.ok) {
      if (result.needsEmailConfirmation) {
        setConfirmationSent(true);
      } else {
        router.replace("/(tabs)");
      }
    }
  }, [canSubmit, email, name, password, signUp, username]);

  if (confirmationSent) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.confirmWrap}>
          <Card variant="soft" bordered={false} style={styles.confirmCard}>
            <Text style={styles.confirmEmoji}>📬</Text>
            <Text style={styles.confirmTitle}>Check your email</Text>
            <Text style={styles.confirmBody}>
              We sent a confirmation link to {email.trim()}. Tap it, then come back and sign in.
            </Text>
            <Button
              title="Back to sign in"
              variant="secondary"
              onPress={() => router.replace("/(auth)/sign-in")}
              style={styles.confirmButton}
            />
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.logo}>Tab</Text>
          <EyebrowTitle eyebrow="JOIN THE TABLE" title="Create account" style={styles.header} />

          <TextField
            label="Name"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (authError) clearError();
            }}
            placeholder="Jacob Kranjc"
            autoCapitalize="words"
            textContentType="name"
            style={styles.field}
          />
          <TextField
            label="Username"
            value={username}
            onChangeText={(text) => {
              setUsername(text.toLowerCase().replace(/\s+/g, ""));
              if (authError) clearError();
            }}
            placeholder="jacobk"
            autoCapitalize="none"
            autoCorrect={false}
            error={username.length > 0 && !usernameValid ? "3–20 chars: a–z, 0–9, underscore" : undefined}
            style={styles.field}
          />
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
            placeholder="At least 6 characters"
            secureTextEntry
            textContentType="newPassword"
            style={styles.field}
          />

          {authError ? <Text style={styles.errorBanner}>{authError}</Text> : null}

          <Button
            title="Create account"
            onPress={handleSubmit}
            disabled={!canSubmit}
            loading={loading}
            style={styles.submit}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/sign-in" replace>
              <Text style={styles.footerLink}>Sign in</Text>
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
  confirmWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  confirmCard: {
    alignItems: "center",
    paddingVertical: spacing.xxxl,
  },
  confirmEmoji: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  confirmTitle: {
    fontFamily: fonts.headingSemiBold,
    fontSize: 24,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  confirmBody: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14.5,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: spacing.xl,
  },
  confirmButton: {
    alignSelf: "stretch",
  },
});
