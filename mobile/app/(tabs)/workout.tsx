import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  activeWorkoutStore,
  useActiveWorkout,
} from "../../src/features/workout/model/active-workout-store";
import { Badge } from "../../src/shared/components/ui/badge";
import { Button } from "../../src/shared/components/ui/button";
import { Card } from "../../src/shared/components/ui/card";
import { theme } from "../../src/shared/constants/theme";

export default function WorkoutScreen() {
  const router = useRouter();
  const activeSession = useActiveWorkout();

  useEffect(() => {
    // Check for crash recovery session on mount
    activeWorkoutStore.init();
  }, []);

  const handleStartTodayWorkout = () => {
    activeWorkoutStore.startSession("Ngực & Tay Sau - Volume Accumulation", [
      {
        id: "ex_bench",
        name: "Barbell Bench Press",
        targetReps: 8,
        targetSets: 4,
        targetWeightKg: 80,
      },
      {
        id: "ex_incline_db",
        name: "Incline Dumbbell Press",
        targetReps: 10,
        targetSets: 3,
        targetWeightKg: 26,
      },
      {
        id: "ex_cable_fly",
        name: "Cable Chest Fly",
        targetReps: 12,
        targetSets: 3,
        targetWeightKg: 15,
      },
      {
        id: "ex_skull_crusher",
        name: "EZ-Bar Skull Crusher",
        targetReps: 10,
        targetSets: 3,
        targetWeightKg: 30,
      },
    ]);
    router.push("/workout/live");
  };

  const handleStartAdhoc = () => {
    activeWorkoutStore.startSession("Tập Luyện Tự Do (Ad-hoc)", [
      {
        id: "ex_squat",
        name: "Barbell Back Squat",
        targetReps: 6,
        targetSets: 4,
        targetWeightKg: 100,
      },
      {
        id: "ex_leg_press",
        name: "Leg Press Machine",
        targetReps: 10,
        targetSets: 3,
        targetWeightKg: 160,
      },
    ]);
    router.push("/workout/live");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Screen Header */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Trung Tâm Tập Luyện</Text>
          <Text style={styles.screenSubtitle}>
            AI Pose Coach & Giám sát tải trọng thời gian thực
          </Text>
        </View>

        {/* Crash Recovery Banner if there's an in-progress session */}
        {activeSession && !activeSession.isCompleted ? (
          <Card style={styles.recoveryCard}>
            <Badge variant="warning">PHỤC HỒI BUỔI TẬP</Badge>
            <Text style={styles.recoveryTitle}>{activeSession.routineTitle}</Text>
            <Text style={styles.recoverySubtitle}>
              Bạn có 1 buổi tập đang dở dang (Tổng khối lượng: {activeSession.totalVolumeKg} kg)
            </Text>
            <View style={styles.recoveryBtnRow}>
              <Button
                onPress={() => activeWorkoutStore.discardSession()}
                style={styles.flexBtn}
                variant="quiet"
              >
                Hủy bỏ
              </Button>
              <Button
                onPress={() => router.push("/workout/live")}
                style={styles.flexBtn}
                variant="primary"
              >
                ⚡ Tiếp Tục Tập
              </Button>
            </View>
          </Card>
        ) : null}

        {/* Section 1: Main Scheduled Workout */}
        <Text style={styles.sectionTitle}>BUỔI TẬP THEO GIÁO ÁN</Text>
        <Card style={styles.mainCard}>
          <View style={styles.cardTagRow}>
            <Badge variant="primary">Chu Trình 4 Tuần</Badge>
            <Text style={styles.timeEstimate}>⏱️ 50 phút</Text>
          </View>
          <Text style={styles.routineTitle}>Ngực & Tay Sau - Volume Accumulation</Text>
          <Text style={styles.routineDesc}>
            Tập trung tăng tải khối lượng cơ ngực với tạ đòn và tạo áp lực liên tục lên cơ tay sau.
          </Text>

          <View style={styles.exercisePreviewList}>
            <Text style={styles.exercisePreviewItem}>
              1. Barbell Bench Press • 4 sets x 8 reps (80kg)
            </Text>
            <Text style={styles.exercisePreviewItem}>
              2. Incline Dumbbell Press • 3 sets x 10 reps (26kg)
            </Text>
            <Text style={styles.exercisePreviewItem}>
              3. Cable Chest Fly • 3 sets x 12 reps (15kg)
            </Text>
            <Text style={styles.exercisePreviewItem}>
              4. EZ-Bar Skull Crusher • 3 sets x 10 reps (30kg)
            </Text>
          </View>

          <Button
            onPress={handleStartTodayWorkout}
            size="large"
            style={styles.startBtn}
            variant="primary"
          >
            🏋️ Bắt Đầu Buổi Tập Ngay
          </Button>
        </Card>

        {/* Section 2: Quick Tools */}
        <Text style={styles.sectionTitle}>CÔNG CỤ PHÒNG TẬP</Text>
        <View style={styles.toolsRow}>
          <Card onPress={handleStartAdhoc} style={styles.toolCard}>
            <Text style={styles.toolIcon}>⚡</Text>
            <Text style={styles.toolTitle}>Tập Tự Do</Text>
            <Text style={styles.toolDesc}>Tùy biến bài tập ad-hoc</Text>
          </Card>

          <Card onPress={() => router.push("/search")} style={styles.toolCard}>
            <Text style={styles.toolIcon}>🔍</Text>
            <Text style={styles.toolTitle}>Tra Cứu Bài</Text>
            <Text style={styles.toolDesc}>500+ bài có video</Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cardTagRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing[3],
  },
  exercisePreviewItem: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginBottom: 4,
  },
  exercisePreviewList: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radius.input,
    marginBottom: theme.spacing[5],
    padding: theme.spacing[3],
  },
  flexBtn: {
    flex: 1,
  },
  header: {
    marginBottom: theme.spacing[6],
  },
  mainCard: {
    marginBottom: theme.spacing[6],
    padding: theme.spacing[5],
  },
  recoveryBtnRow: {
    flexDirection: "row",
    gap: theme.spacing[3],
    marginTop: theme.spacing[4],
  },
  recoveryCard: {
    backgroundColor: "rgba(255, 90, 71, 0.08)",
    borderColor: "rgba(255, 90, 71, 0.4)",
    marginBottom: theme.spacing[6],
    padding: theme.spacing[5],
  },
  recoverySubtitle: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  recoveryTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginTop: theme.spacing[2],
  },
  routineDesc: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: theme.spacing[4],
  },
  routineTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: theme.spacing[2],
  },
  safeArea: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  screenSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  screenTitle: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  scrollContent: {
    padding: theme.spacing[4],
    paddingBottom: theme.spacing[10],
  },
  sectionTitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: theme.spacing[3],
  },
  startBtn: {
    marginTop: theme.spacing[2],
  },
  timeEstimate: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  toolCard: {
    alignItems: "center",
    flex: 1,
    padding: theme.spacing[4],
  },
  toolDesc: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
    textAlign: "center",
  },
  toolIcon: {
    fontSize: 28,
    marginBottom: theme.spacing[2],
  },
  toolTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  toolsRow: {
    flexDirection: "row",
    gap: theme.spacing[3],
  },
});
