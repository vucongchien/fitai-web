import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  activeWorkoutStore,
  useActiveWorkout,
} from "../../src/features/workout/model/active-workout-store";
import { restTimer, useRestTimer } from "../../src/features/workout/model/rest-timer";
import { Badge } from "../../src/shared/components/ui/badge";
import { Button } from "../../src/shared/components/ui/button";
import { Card } from "../../src/shared/components/ui/card";
import { theme } from "../../src/shared/constants/theme";
import { nativeKeepAwake } from "../../src/shared/lib/keep-awake";

export default function LiveWorkoutScreen() {
  const router = useRouter();
  const session = useActiveWorkout();
  const rest = useRestTimer();

  const [inputWeight, setInputWeight] = useState("80");
  const [inputReps, setInputReps] = useState("8");
  const [inputRpe, setInputRpe] = useState("8");
  const [aiHudActive, setAiHudActive] = useState(false);

  useEffect(() => {
    // Keep screen awake while training
    void nativeKeepAwake.activate();
    return () => {
      void nativeKeepAwake.deactivate();
    };
  }, []);

  if (!session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Không có buổi tập nào đang diễn ra.</Text>
          <Button onPress={() => router.replace("/(tabs)/workout")} variant="primary">
            Quay lại Trung tâm tập luyện
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const currentEx = session.exercises[session.currentExerciseIndex] || session.exercises[0];

  const handleCompleteSet = () => {
    const reps = parseInt(inputReps, 10) || 8;
    const weight = parseFloat(inputWeight) || 0;
    const rpe = parseFloat(inputRpe) || 8;

    activeWorkoutStore.completeSet(session.currentExerciseIndex, reps, weight, rpe);

    // Auto-start 90s rest timer
    restTimer.start(90);
  };

  const handleFinishWorkout = () => {
    activeWorkoutStore.finishSession();
    router.replace("/workout/summary");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header HUD */}
        <View style={styles.topHud}>
          <View>
            <Text style={styles.routineTitle}>{session.routineTitle}</Text>
            <Text style={styles.volumeCounter}>
              Tổng tải trọng: <Text style={styles.highlightVal}>{session.totalVolumeKg}</Text> kg
            </Text>
          </View>
          <Pressable
            onPress={() => setAiHudActive(!aiHudActive)}
            style={[styles.hudToggle, aiHudActive && styles.hudToggleActive]}
          >
            <Text style={[styles.hudToggleText, aiHudActive && styles.hudToggleTextActive]}>
              {aiHudActive ? "🎥 AI HUD ON" : "📝 Nhập Tay"}
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* AI Camera HUD Simulator if active */}
          {aiHudActive ? (
            <Card style={styles.aiCameraHud}>
              <View style={styles.aiStatusRow}>
                <Badge variant="success">AI TRACKING • 60 FPS</Badge>
                <Text style={styles.aiRomText}>ROM: 94° (Độ sâu đạt chuẩn)</Text>
              </View>
              <View style={styles.skeletonOverlay}>
                <Text style={styles.skeletonFigure}>🏃‍♂️</Text>
                <Text style={styles.skeletonCue}>"Giữ thẳng lưng dưới, đẩy ngực lên"</Text>
              </View>
            </Card>
          ) : null}

          {/* Current Exercise Card */}
          <Card style={styles.currentExerciseCard}>
            <View style={styles.exerciseHeader}>
              <Badge variant="primary">
                Bài {session.currentExerciseIndex + 1} / {session.exercises.length}
              </Badge>
              <Text style={styles.targetSetsMeta}>
                Mục tiêu: {currentEx.targetSets} sets x {currentEx.targetReps} reps (
                {currentEx.targetWeightKg}kg)
              </Text>
            </View>

            <Text style={styles.exerciseName}>{currentEx.name}</Text>

            {/* Set Inputs */}
            <View style={styles.inputRow}>
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>Mức Tạ (kg)</Text>
                <TextInput
                  keyboardType="numeric"
                  onChangeText={setInputWeight}
                  style={styles.textInput}
                  value={inputWeight}
                />
              </View>

              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>Số Reps</Text>
                <TextInput
                  keyboardType="numeric"
                  onChangeText={setInputReps}
                  style={styles.textInput}
                  value={inputReps}
                />
              </View>

              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>RPE (Độ mệt)</Text>
                <TextInput
                  keyboardType="numeric"
                  onChangeText={setInputRpe}
                  style={styles.textInput}
                  value={inputRpe}
                />
              </View>
            </View>

            <Button
              onPress={handleCompleteSet}
              size="large"
              style={styles.completeSetBtn}
              variant="primary"
            >
              ✓ Xác Nhận Xong Hiệp {session.currentSetIndex}
            </Button>
          </Card>

          {/* Completed Sets History for Current Exercise */}
          <Text style={styles.sectionTitle}>CÁC HIỆP ĐÃ HOÀN THÀNH</Text>
          {currentEx.completedSets.length > 0 ? (
            currentEx.completedSets.map((s) => (
              <View key={s.setNumber} style={styles.setRow}>
                <Text style={styles.setNumText}>Set {s.setNumber}</Text>
                <Text style={styles.setWeightReps}>
                  {s.weightKg} kg x {s.reps} reps
                </Text>
                <Badge variant="success">RPE {s.rpe || 8}</Badge>
              </View>
            ))
          ) : (
            <Text style={styles.noSetsText}>Chưa có hiệp nào được hoàn thành cho bài này.</Text>
          )}

          {/* Finish workout button */}
          <Button
            onPress={handleFinishWorkout}
            size="large"
            style={styles.finishBtn}
            variant="secondary"
          >
            🏁 Hoàn Thành Buổi Tập
          </Button>
        </ScrollView>

        {/* Rest Timer Floating Modal */}
        <Modal animationType="fade" transparent visible={rest.isActive}>
          <View style={styles.modalBackdrop}>
            <Card style={styles.restTimerModal}>
              <Text style={styles.restTitle}>THỜI GIAN NGHỈ GIỮA HIỆP</Text>
              <Text style={styles.restClock}>{rest.formattedTime}</Text>

              <View style={styles.restBtnRow}>
                <Button
                  onPress={() => restTimer.addSeconds(30)}
                  style={styles.restFlexBtn}
                  variant="secondary"
                >
                  +30s
                </Button>
                <Button
                  onPress={() => restTimer.stop()}
                  style={styles.restFlexBtn}
                  variant="primary"
                >
                  Tập Luôn
                </Button>
              </View>
            </Card>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  aiCameraHud: {
    backgroundColor: "rgba(37, 199, 122, 0.08)",
    borderColor: theme.colors.fieldGreen,
    marginBottom: theme.spacing[4],
    padding: theme.spacing[4],
  },
  aiRomText: {
    color: theme.colors.fieldGreen,
    fontSize: 12,
    fontWeight: "700",
  },
  aiStatusRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  completeSetBtn: {
    marginTop: theme.spacing[3],
  },
  container: {
    flex: 1,
  },
  currentExerciseCard: {
    borderColor: theme.colors.relayBlue,
    marginBottom: theme.spacing[5],
    padding: theme.spacing[5],
  },
  emptyContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: theme.spacing[6],
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 16,
    marginBottom: theme.spacing[4],
  },
  exerciseHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing[2],
  },
  exerciseName: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: theme.spacing[4],
  },
  finishBtn: {
    marginBottom: theme.spacing[8],
    marginTop: theme.spacing[6],
  },
  highlightVal: {
    color: theme.colors.relayBlue,
    fontWeight: "800",
  },
  hudToggle: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.round,
    borderWidth: 1,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: 6,
  },
  hudToggleActive: {
    backgroundColor: "rgba(37, 199, 122, 0.2)",
    borderColor: theme.colors.fieldGreen,
  },
  hudToggleText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  hudToggleTextActive: {
    color: theme.colors.fieldGreen,
  },
  inputCol: {
    flex: 1,
  },
  inputLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: "row",
    gap: theme.spacing[3],
    marginBottom: theme.spacing[4],
  },
  modalBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    flex: 1,
    justifyContent: "center",
    padding: theme.spacing[6],
  },
  noSetsText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontStyle: "italic",
    marginBottom: theme.spacing[4],
  },
  restBtnRow: {
    flexDirection: "row",
    gap: theme.spacing[3],
    width: "100%",
  },
  restClock: {
    color: theme.colors.relayBlue,
    fontSize: 56,
    fontWeight: "900",
    marginVertical: theme.spacing[4],
  },
  restFlexBtn: {
    flex: 1,
  },
  restTimerModal: {
    alignItems: "center",
    padding: theme.spacing[6],
    width: "100%",
  },
  restTitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  routineTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  safeArea: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing[4],
  },
  sectionTitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: theme.spacing[3],
  },
  setNumText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  setRow: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.input,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing[2],
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
  },
  setWeightReps: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  skeletonCue: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  skeletonFigure: {
    fontSize: 48,
  },
  skeletonOverlay: {
    alignItems: "center",
    marginVertical: theme.spacing[3],
  },
  targetSetsMeta: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  textInput: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.input,
    borderWidth: 1,
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "700",
    minHeight: 48,
    paddingHorizontal: theme.spacing[3],
    textAlign: "center",
  },
  topHud: {
    alignItems: "center",
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
  },
  volumeCounter: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
});
