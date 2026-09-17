import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { authStore, useAuth } from "../../src/features/auth/model/auth-store";
import { profileStore, useProfile } from "../../src/features/profile/model/profile-store";
import { Badge } from "../../src/shared/components/ui/badge";
import { Button } from "../../src/shared/components/ui/button";
import { Card } from "../../src/shared/components/ui/card";
import { EmptyState } from "../../src/shared/components/ui/empty-state";
import { ErrorState } from "../../src/shared/components/ui/error-state";
import { LoadingState } from "../../src/shared/components/ui/loading-state";
import { theme } from "../../src/shared/constants/theme";

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { bodyFatPercent, error, heightCm, isLoading, painPoints, preferences, weightKg } =
    useProfile();

  const [newPainLocation, setNewPainLocation] = useState("");
  const [showAddPain, setShowAddPain] = useState(false);

  if (isLoading) {
    return <LoadingState fullscreen message="Đang nạp hồ sơ cá nhân..." />;
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState message={error} />
      </SafeAreaView>
    );
  }

  const bmi = (weightKg / Math.pow(heightCm / 100, 2)).toFixed(1);

  const handleLogout = async () => {
    await authStore.logout();
    router.replace("/(auth)/login");
  };

  const handleAddPain = () => {
    if (!newPainLocation.trim()) {
      return;
    }
    profileStore.addPainPoint({
      location: newPainLocation.trim(),
      severity: "mild",
    });
    setNewPainLocation("");
    setShowAddPain(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card Header */}
        <Card style={styles.profileHeaderCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "AT"}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name || "Athlete"}</Text>
          <Text style={styles.userEmail}>{user?.email || "athlete@fitai.app"}</Text>
          <Badge style={styles.roleBadge} variant="primary">
            Hội Viên Active • Level 12
          </Badge>
        </Card>

        {/* Biometric Stats */}
        <Text style={styles.sectionTitle}>THỂ SỐ THỂ HÌNH</Text>
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Cân Nặng</Text>
            <Text style={styles.statVal}>
              {weightKg} <Text style={styles.statUnit}>kg</Text>
            </Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Chiều Cao</Text>
            <Text style={styles.statVal}>
              {heightCm} <Text style={styles.statUnit}>cm</Text>
            </Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Mỡ Cơ Thể</Text>
            <Text style={styles.statVal}>
              {bodyFatPercent} <Text style={styles.statUnit}>%</Text>
            </Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Chỉ Số BMI</Text>
            <Text style={styles.statVal}>{bmi}</Text>
          </Card>
        </View>

        {/* Injury & Pain Tracking */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>THEO DÕI ĐIỂM ĐAU & CHẤN THƯƠNG</Text>
          <Pressable onPress={() => setShowAddPain(!showAddPain)}>
            <Text style={styles.actionText}>{showAddPain ? "Đóng" : "+ Báo điểm đau"}</Text>
          </Pressable>
        </View>

        {showAddPain ? (
          <Card style={styles.addPainCard}>
            <Text style={styles.addPainTitle}>Khai Báo Điểm Đau Mới</Text>
            <TextInput
              onChangeText={setNewPainLocation}
              placeholder="Ví dụ: Cổ tay trái, Khớp gối phải..."
              placeholderTextColor={theme.colors.textMuted}
              style={styles.painInput}
              value={newPainLocation}
            />
            <Button onPress={handleAddPain} size="medium" variant="primary">
              Lưu Điểm Đau
            </Button>
          </Card>
        ) : null}

        {painPoints.length > 0 ? (
          painPoints.map((pain) => (
            <Card key={pain.id} style={styles.painCard}>
              <View style={styles.painRow}>
                <View>
                  <Text style={styles.painLocation}>{pain.location}</Text>
                  {pain.notes ? <Text style={styles.painNotes}>{pain.notes}</Text> : null}
                </View>
                <Pressable onPress={() => profileStore.removePainPoint(pain.id)}>
                  <Text style={styles.deleteText}>Đã khỏi</Text>
                </Pressable>
              </View>
            </Card>
          ))
        ) : (
          <EmptyState
            description="Không có chấn thương nào được ghi nhận. Bạn đang ở thể trạng tốt nhất!"
            icon="💪"
            title="Không có điểm đau"
          />
        )}

        {/* Preferences */}
        <Text style={styles.sectionTitle}>CÀI ĐẶT ỨNG DỤNG</Text>
        <Card style={styles.prefCard}>
          <View style={styles.prefRow}>
            <View style={styles.prefTextWrap}>
              <Text style={styles.prefTitle}>Rung Phản Hồi Phần Cứng (Haptics)</Text>
              <Text style={styles.prefDesc}>Rung khi hoàn thành set và khi hết giờ nghỉ</Text>
            </View>
            <Switch
              onValueChange={(val) => profileStore.updatePreferences({ hapticEnabled: val })}
              thumbColor={preferences.hapticEnabled ? theme.colors.relayBlue : "#71717a"}
              trackColor={{ false: "#27272a", true: "rgba(75, 87, 242, 0.4)" }}
              value={preferences.hapticEnabled}
            />
          </View>

          <View style={styles.prefRowDivider} />

          <View style={styles.prefRow}>
            <View style={styles.prefTextWrap}>
              <Text style={styles.prefTitle}>Chế Độ AI Camera Mặc Định</Text>
              <Text style={styles.prefDesc}>Bật skeleton AI đếm rep khi vào buổi tập</Text>
            </View>
            <Switch
              onValueChange={(val) => profileStore.updatePreferences({ cameraAiMode: val })}
              thumbColor={preferences.cameraAiMode ? theme.colors.relayBlue : "#71717a"}
              trackColor={{ false: "#27272a", true: "rgba(75, 87, 242, 0.4)" }}
              value={preferences.cameraAiMode}
            />
          </View>
        </Card>

        {/* Logout Button */}
        <Button onPress={handleLogout} size="large" style={styles.logoutBtn} variant="danger">
          Đăng Xuất Khỏi Thiết Bị
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actionText: {
    color: theme.colors.relayBlue,
    fontSize: 13,
    fontWeight: "600",
  },
  addPainCard: {
    marginBottom: theme.spacing[4],
    padding: theme.spacing[4],
  },
  addPainTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: theme.spacing[3],
  },
  avatar: {
    alignItems: "center",
    backgroundColor: theme.colors.relayBlue,
    borderRadius: theme.radius.round,
    height: 72,
    justifyContent: "center",
    marginBottom: theme.spacing[3],
    width: 72,
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "900",
  },
  deleteText: {
    color: theme.colors.fieldGreen,
    fontSize: 12,
    fontWeight: "700",
  },
  logoutBtn: {
    marginTop: theme.spacing[6],
  },
  painCard: {
    marginBottom: theme.spacing[3],
    padding: theme.spacing[4],
  },
  painInput: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.input,
    borderWidth: 1,
    color: theme.colors.text,
    fontSize: 14,
    marginBottom: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
  },
  painLocation: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  painNotes: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  painRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  prefCard: {
    padding: theme.spacing[4],
  },
  prefDesc: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  prefRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: theme.spacing[2],
  },
  prefRowDivider: {
    backgroundColor: theme.colors.border,
    height: 1,
    marginVertical: theme.spacing[2],
  },
  prefTextWrap: {
    flex: 1,
    paddingRight: theme.spacing[3],
  },
  prefTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  profileHeaderCard: {
    alignItems: "center",
    marginBottom: theme.spacing[6],
    padding: theme.spacing[6],
  },
  roleBadge: {
    marginTop: theme.spacing[3],
  },
  safeArea: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing[4],
    paddingBottom: theme.spacing[10],
  },
  sectionHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing[3],
  },
  sectionTitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: theme.spacing[3],
  },
  statCard: {
    alignItems: "center",
    padding: theme.spacing[4],
    width: "48%",
  },
  statLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  statUnit: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: "400",
  },
  statVal: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: "4%",
    justifyContent: "space-between",
    marginBottom: theme.spacing[6],
    rowGap: theme.spacing[3],
  },
  userEmail: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  userName: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
});
