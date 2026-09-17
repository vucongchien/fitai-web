import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { computeCircularProgress } from "@/shared/ui/charts/use-circular-progress";

import { useAuth } from "../../src/features/auth/model/auth-store";
import {
  todayDashboardStore,
  useTodayDashboard,
} from "../../src/features/today/model/today-dashboard";
import { activeWorkoutStore } from "../../src/features/workout/model/active-workout-store";
import { Badge } from "../../src/shared/components/ui/badge";
import { Button } from "../../src/shared/components/ui/button";
import { Card } from "../../src/shared/components/ui/card";
import { EmptyState } from "../../src/shared/components/ui/empty-state";
import { ErrorState } from "../../src/shared/components/ui/error-state";
import { LoadingState } from "../../src/shared/components/ui/loading-state";
import { theme } from "../../src/shared/constants/theme";

export default function TodayScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { error, isLoading, macros, meals, streakDays, todayWorkout } = useTodayDashboard();

  if (isLoading) {
    return <LoadingState fullscreen message="Đang nạp dữ liệu hôm nay..." />;
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState message={error} onRetry={() => todayDashboardStore.reset()} />
      </SafeAreaView>
    );
  }

  const calorieMetrics = computeCircularProgress(macros.currentCalories, macros.targetCalories, 48);

  const handleStartWorkout = () => {
    if (todayWorkout) {
      activeWorkoutStore.startSession(todayWorkout.title, [
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
          id: "ex_dips",
          name: "Chest Dips",
          targetReps: 12,
          targetSets: 3,
          targetWeightKg: 0,
        },
        {
          id: "ex_tricep_cable",
          name: "Tricep Pushdown",
          targetReps: 15,
          targetSets: 3,
          targetWeightKg: 30,
        },
      ]);
      router.push("/workout/live");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header: Athlete info & Streak */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Xin chào,</Text>
            <Text style={styles.userName}>{user?.name || "Athlete"}</Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 {streakDays} ngày streak</Text>
          </View>
        </View>

        {/* Section 1: Today Workout */}
        <Text style={styles.sectionTitle}>BUỔI TẬP HÔM NAY</Text>
        {todayWorkout ? (
          <Card style={styles.workoutCard}>
            <View style={styles.workoutHeader}>
              <View style={styles.workoutTitleWrap}>
                <Badge variant="primary">Lộ Trình Tuần 1</Badge>
                <Text style={styles.workoutTitle}>{todayWorkout.title}</Text>
                <Text style={styles.workoutMeta}>
                  ⏱️ ~{todayWorkout.durationMinutes} phút • 🏋️ {todayWorkout.exerciseCount} bài tập
                </Text>
              </View>
            </View>

            <Button
              onPress={handleStartWorkout}
              size="large"
              style={styles.startBtn}
              variant="primary"
            >
              ⚡ Bắt Đầu Tập Luyện
            </Button>
          </Card>
        ) : (
          <EmptyState
            action={
              <Button onPress={() => router.push("/(tabs)/workout")} variant="secondary">
                Khám phá bài tập
              </Button>
            }
            description="Hôm nay là ngày nghỉ theo giáo án, hãy tập trung phục hồi."
            icon="🛌"
            title="Ngày nghỉ ngơi (Rest Day)"
          />
        )}

        {/* Section 2: Macro & Calorie Ring */}
        <Text style={styles.sectionTitle}>TIẾN ĐỘ DINH DƯỠNG</Text>
        <Card style={styles.macroCard}>
          <View style={styles.macroHeader}>
            <View>
              <Text style={styles.calorieCurrent}>
                {macros.currentCalories}{" "}
                <Text style={styles.calorieUnit}>/ {macros.targetCalories} kcal</Text>
              </Text>
              <Text style={styles.caloriePercentage}>
                Đã nạp {calorieMetrics.percentage}% mục tiêu năng lượng
              </Text>
            </View>
            <View style={styles.calPill}>
              <Text style={styles.calPillText}>{calorieMetrics.percentage}%</Text>
            </View>
          </View>

          {/* Macro Progress Bars */}
          <View style={styles.macroBarsRow}>
            <View style={styles.macroCol}>
              <Text style={styles.macroLabel}>Protein</Text>
              <Text style={styles.macroVal}>
                {macros.protein}/{macros.proteinTarget}g
              </Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      backgroundColor: theme.colors.relayBlue,
                      width: `${Math.min(100, (macros.protein / macros.proteinTarget) * 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.macroCol}>
              <Text style={styles.macroLabel}>Carbs</Text>
              <Text style={styles.macroVal}>
                {macros.carbs}/{macros.carbsTarget}g
              </Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      backgroundColor: theme.colors.sprintCoral,
                      width: `${Math.min(100, (macros.carbs / macros.carbsTarget) * 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.macroCol}>
              <Text style={styles.macroLabel}>Fat</Text>
              <Text style={styles.macroVal}>
                {macros.fat}/{macros.fatTarget}g
              </Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      backgroundColor: theme.colors.fieldGreen,
                      width: `${Math.min(100, (macros.fat / macros.fatTarget) * 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </Card>

        {/* Section 3: Meal Timeline */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>CÁC BỮA ĂN HÔM NAY</Text>
          <Pressable onPress={() => router.push("/nutrition/log-meal")}>
            <Text style={styles.logActionText}>+ Ghi chép bữa</Text>
          </Pressable>
        </View>

        {meals.length > 0 ? (
          meals.map((meal) => (
            <Card key={meal.id} style={styles.mealCard}>
              <View style={styles.mealRow}>
                <View>
                  <Text style={styles.mealSlot}>
                    {meal.slot} • {meal.timeString}
                  </Text>
                  <Text style={styles.mealName}>{meal.name}</Text>
                </View>
                <Badge variant={meal.isLogged ? "success" : "warning"}>
                  {meal.isLogged ? `${meal.calories} kcal` : "Chưa log"}
                </Badge>
              </View>
            </Card>
          ))
        ) : (
          <EmptyState
            action={
              <Button onPress={() => router.push("/nutrition/log-meal")} variant="primary">
                Ghi chép bữa đầu tiên
              </Button>
            }
            description="Chưa có món ăn nào được ghi nhận cho ngày hôm nay."
            icon="🥗"
            title="Chưa có bữa ăn"
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  barFill: {
    borderRadius: theme.radius.round,
    height: "100%",
  },
  barTrack: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radius.round,
    height: 6,
    overflow: "hidden",
    width: "100%",
  },
  calPill: {
    backgroundColor: "rgba(75, 87, 242, 0.15)",
    borderColor: theme.colors.relayBlue,
    borderRadius: theme.radius.round,
    borderWidth: 1,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1],
  },
  calPillText: {
    color: theme.colors.relayBlue,
    fontSize: 14,
    fontWeight: "700",
  },
  calorieCurrent: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  caloriePercentage: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  calorieUnit: {
    color: theme.colors.textMuted,
    fontSize: 15,
    fontWeight: "400",
  },
  greeting: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing[6],
  },
  logActionText: {
    color: theme.colors.relayBlue,
    fontSize: 13,
    fontWeight: "600",
  },
  macroBarsRow: {
    flexDirection: "row",
    gap: theme.spacing[4],
    justifyContent: "space-between",
  },
  macroCard: {
    marginBottom: theme.spacing[6],
    padding: theme.spacing[5],
  },
  macroCol: {
    flex: 1,
  },
  macroHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing[4],
  },
  macroLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  macroVal: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  mealCard: {
    marginBottom: theme.spacing[3],
    padding: theme.spacing[4],
  },
  mealName: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "600",
    marginTop: 2,
  },
  mealRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  mealSlot: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
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
  startBtn: {
    marginTop: theme.spacing[4],
  },
  streakBadge: {
    backgroundColor: "rgba(255, 90, 71, 0.15)",
    borderColor: "rgba(255, 90, 71, 0.3)",
    borderRadius: theme.radius.round,
    borderWidth: 1,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1],
  },
  streakText: {
    color: theme.colors.sprintCoral,
    fontSize: 13,
    fontWeight: "700",
  },
  userName: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  workoutCard: {
    borderColor: "rgba(75, 87, 242, 0.4)",
    marginBottom: theme.spacing[6],
    padding: theme.spacing[5],
  },
  workoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  workoutMeta: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  workoutTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginTop: theme.spacing[2],
  },
  workoutTitleWrap: {
    flex: 1,
  },
});
