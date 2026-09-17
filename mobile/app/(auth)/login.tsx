import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { authStore, useAuth } from "../../src/features/auth/model/auth-store";
import { Button } from "../../src/shared/components/ui/button";
import { Card } from "../../src/shared/components/ui/card";
import { ErrorState } from "../../src/shared/components/ui/error-state";
import { theme } from "../../src/shared/constants/theme";

export default function LoginScreen() {
  const router = useRouter();
  const { error, isLoading } = useAuth();

  const [email, setEmail] = useState("athlete@fitai.app");
  const [password, setPassword] = useState("password123");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFastDevLogin = async () => {
    setLocalError(null);
    try {
      await authStore.fastDevLogin({
        email: "athlete@fitai.app",
        id: "usr_athlete_dev",
        name: "Dev Athlete",
        role: "user",
      });
      router.replace("/(tabs)/today");
    } catch {
      setLocalError("Đăng nhập thử nghiệm không thành công");
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) {
      setLocalError("Vui lòng nhập đầy đủ email và mật khẩu");
      return;
    }
    setLocalError(null);
    try {
      await authStore.fastDevLogin({
        email,
        id: `usr_${Date.now()}`,
        name: email.split("@")[0] || "Athlete",
        role: "user",
      });
      router.replace("/(tabs)/today");
    } catch {
      setLocalError("Đăng nhập không thành công, vui lòng thử lại");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Brand Header */}
        <View style={styles.header}>
          <Text style={styles.brandTitle}>
            FIT<Text style={styles.brandAccent}>AI</Text>
          </Text>
          <Text style={styles.brandSubtitle}>Triple Lane Coaching & Real-Time Motion</Text>
        </View>

        {/* Error State if any */}
        {error || localError ? (
          <ErrorState
            message={error || localError || ""}
            onRetry={() => setLocalError(null)}
            title="Lỗi đăng nhập"
          />
        ) : null}

        {/* Form Card */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Đăng Nhập</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="athlete@fitai.app"
            placeholderTextColor={theme.colors.textMuted}
            style={styles.input}
            value={email}
          />

          <Text style={styles.label}>Mật khẩu</Text>
          <TextInput
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={theme.colors.textMuted}
            secureTextEntry
            style={styles.input}
            value={password}
          />

          <Button
            loading={isLoading}
            onPress={handleEmailLogin}
            size="large"
            style={styles.submitBtn}
            variant="primary"
          >
            Đăng Nhập
          </Button>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>HOẶC</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Dev Fast Login Button */}
          <Button loading={isLoading} onPress={handleFastDevLogin} size="large" variant="secondary">
            ⚡ Đăng Nhập Nhanh (Dev Fast-Login)
          </Button>

          <Pressable
            onPress={() => router.push("/(auth)/onboarding")}
            style={styles.onboardingLink}
          >
            <Text style={styles.onboardingText}>
              Chưa có tài khoản? <Text style={styles.onboardingHighlight}>Thiết lập hồ sơ mới</Text>
            </Text>
          </Pressable>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  brandAccent: {
    color: theme.colors.relayBlue,
  },
  brandSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 14,
    marginTop: theme.spacing[2],
  },
  brandTitle: {
    color: theme.colors.text,
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: 2,
  },
  card: {
    padding: theme.spacing[6],
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: theme.spacing[5],
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: theme.spacing[4],
  },
  divider: {
    alignItems: "center",
    flexDirection: "row",
    marginVertical: theme.spacing[5],
  },
  dividerLine: {
    backgroundColor: theme.colors.border,
    flex: 1,
    height: 1,
  },
  dividerText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    marginHorizontal: theme.spacing[3],
  },
  header: {
    alignItems: "center",
    marginBottom: theme.spacing[8],
  },
  input: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.input,
    borderWidth: 1,
    color: theme.colors.text,
    fontSize: 15,
    marginBottom: theme.spacing[4],
    minHeight: 48,
    paddingHorizontal: theme.spacing[4],
  },
  label: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: theme.spacing[1],
  },
  onboardingHighlight: {
    color: theme.colors.relayBlue,
    fontWeight: "600",
  },
  onboardingLink: {
    alignItems: "center",
    marginTop: theme.spacing[5],
  },
  onboardingText: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  safeArea: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  submitBtn: {
    marginTop: theme.spacing[2],
  },
});
