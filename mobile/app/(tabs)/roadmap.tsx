import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { roadmapStore, useRoadmap } from "../../src/features/roadmap/model/roadmap-store";
import { activeWorkoutStore } from "../../src/features/workout/model/active-workout-store";
import { Badge } from "../../src/shared/components/ui/badge";
import { Button } from "../../src/shared/components/ui/button";
import { Card } from "../../src/shared/components/ui/card";
import { EmptyState } from "../../src/shared/components/ui/empty-state";
import { ErrorState } from "../../src/shared/components/ui/error-state";
import { LoadingState } from "../../src/shared/components/ui/loading-state";
import { theme } from "../../src/shared/constants/theme";

export default function RoadmapScreen() {
  const router = useRouter();
  const { currentWeekNumber, error, isLoading, weeks } = useRoadmap();

  if (isLoading) {
    return <LoadingState fullscreen message="Đang nạp chu trình lộ trình..." />;
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState message={error} onRetry={() => roadmapStore.setError(null)} />
      </SafeAreaView>
    );
  }

  const activeWeek = weeks.find((w) => w.weekNumber === currentWeekNumber) || weeks[0];

  const handleStartSession = (sessionTitle: string) => {
    activeWorkoutStore.startSession(sessionTitle, [
      { id: "ex_1", name: "Compound Core Lift", targetReps: 8, targetSets: 4, targetWeightKg: 70 },
      {
        id: "ex_2",
        name: "Secondary Hypertrophy",
        targetReps: 12,
        targetSets: 3,
        targetWeightKg: 20,
      },
    ]);
    router.push("/workout/live");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Chu Trình 4 Tuần</Text>
          <Text style={styles.screenSubtitle}>
            Giáo án cá nhân hóa định kỳ 4 tuần (Mesocycle Progression)
          </Text>
        </View>

        {/* Week Selector Tabs */}
        <View style={styles.tabsRow}>
          {weeks.map((w) => {
            const isSelected = w.weekNumber === currentWeekNumber;
            return (
              <Pressable
                key={w.weekNumber}
                onPress={() => roadmapStore.selectWeek(w.weekNumber)}
                style={[styles.tabItem, isSelected && styles.tabItemSelected]}
              >
                <Text style={[styles.tabText, isSelected && styles.tabTextSelected]}>
                  Tuần {w.weekNumber}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Current Week Focus Banner */}
        {activeWeek ? (
          <Card style={styles.focusCard}>
            <View style={styles.focusHeader}>
              <Badge variant={activeWeek.isDeload ? "warning" : "primary"}>
                {activeWeek.isDeload
                  ? "TUẦN GIẢM TẢI (DELOAD)"
                  : `TUẦN ${activeWeek.weekNumber} / 4`}
              </Badge>
              <Text style={styles.sessionCounter}>
                {activeWeek.sessions.filter((s) => s.isCompleted).length} /{" "}
                {activeWeek.sessions.length} hoàn thành
              </Text>
            </View>
            <Text style={styles.focusTitle}>{activeWeek.focus}</Text>
          </Card>
        ) : null}

        {/* Sessions in Active Week */}
        <Text style={styles.sectionTitle}>CÁC BUỔI TẬP TRONG TUẦN</Text>

        {activeWeek && activeWeek.sessions.length > 0 ? (
          activeWeek.sessions.map((session) => (
            <Card key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionHeaderRow}>
                <View style={styles.sessionTitleWrap}>
                  <Text style={styles.dayBadge}>{session.dayName}</Text>
                  <Text style={styles.sessionTitle}>{session.title}</Text>
                  <Text style={styles.sessionMuscles}>
                    Nhóm cơ: {session.targetMuscles.join(", ")}
                  </Text>
                </View>
                <Badge variant={session.isCompleted ? "success" : "warning"}>
                  {session.isCompleted ? "Đã tập" : "Chưa tập"}
                </Badge>
              </View>

              {!session.isCompleted ? (
                <Button
                  onPress={() => handleStartSession(session.title)}
                  size="medium"
                  style={styles.actionBtn}
                  variant="secondary"
                >
                  ⚡ Bắt đầu buổi này
                </Button>
              ) : null}
            </Card>
          ))
        ) : (
          <EmptyState
            description="Tuần này chưa có lịch tập nào được xếp."
            icon="📅"
            title="Chưa có buổi tập"
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actionBtn: {
    marginTop: theme.spacing[3],
  },
  dayBadge: {
    color: theme.colors.relayBlue,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  focusCard: {
    borderColor: "rgba(75, 87, 242, 0.3)",
    marginBottom: theme.spacing[6],
    padding: theme.spacing[5],
  },
  focusHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing[2],
  },
  focusTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
  },
  header: {
    marginBottom: theme.spacing[6],
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
  sessionCard: {
    marginBottom: theme.spacing[3],
    padding: theme.spacing[4],
  },
  sessionCounter: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  sessionHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sessionMuscles: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  sessionTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 2,
  },
  sessionTitleWrap: {
    flex: 1,
  },
  tabItem: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceSubtle,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.input,
    borderWidth: 1,
    flex: 1,
    paddingVertical: theme.spacing[2],
  },
  tabItemSelected: {
    backgroundColor: theme.colors.relayBlue,
    borderColor: theme.colors.relayBlue,
  },
  tabText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  tabTextSelected: {
    color: "#ffffff",
    fontWeight: "700",
  },
  tabsRow: {
    flexDirection: "row",
    gap: theme.spacing[2],
    marginBottom: theme.spacing[5],
  },
});
