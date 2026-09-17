import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { authStore } from "../../src/features/auth/model/auth-store";
import { Button } from "../../src/shared/components/ui/button";
import { Card } from "../../src/shared/components/ui/card";
import { theme } from "../../src/shared/constants/theme";

const GOALS = [
  {
    desc: "Phát triển khối lượng cơ bắp tối đa",
    id: "BUILD_MUSCLE",
    title: "Tăng cơ (Hypertrophy)",
  },
  { desc: "Giảm mỡ thừa & giữ cơ săn chắc", id: "FAT_LOSS", title: "Giảm mỡ (Fat Loss)" },
  { desc: "Tối ưu mức tạ 1RM các bài compound", id: "STRENGTH", title: "Tăng sức mạnh (Strength)" },
];

const EQUIPMENTS = [
  { id: "barbell", label: "🏋️ Tạ đòn (Barbell)" },
  { id: "dumbbell", label: "💪 Tạ đơn (Dumbbell)" },
  { id: "cable", label: "⛓️ Dây cáp (Cable)" },
  { id: "machine", label: "⚙️ Máy khối (Machines)" },
];

const WEEKDAYS = [
  { day: "Thứ 2", id: "mon" },
  { day: "Thứ 3", id: "tue" },
  { day: "Thứ 4", id: "wed" },
  { day: "Thứ 5", id: "thu" },
  { day: "Thứ 6", id: "fri" },
  { day: "Thứ 7", id: "sat" },
  { day: "Chủ nhật", id: "sun" },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Form states
  const [selectedGoal, setSelectedGoal] = useState("BUILD_MUSCLE");
  const [heightCm, setHeightCm] = useState("175");
  const [weightKg, setWeightKg] = useState("72");
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>(["barbell", "dumbbell"]);
  const [selectedDays, setSelectedDays] = useState<string[]>(["mon", "wed", "fri"]);

  const toggleEquipment = (id: string) => {
    setSelectedEquipments((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleDay = (id: string) => {
    setSelectedDays((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
  };

  const handleFinish = async () => {
    await authStore.fastDevLogin({
      email: "new_athlete@fitai.app",
      id: `usr_${Date.now()}`,
      name: "Tân Binh FITAI",
      role: "user",
    });
    router.replace("/(tabs)/today");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Progress header */}
        <View style={styles.progressHeader}>
          <Text style={styles.stepIndicator}>BƯỚC {step} / 4</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(step / 4) * 100}%` }]} />
          </View>
        </View>

        {/* Step 1: Goal */}
        {step === 1 ? (
          <Card style={styles.card}>
            <Text style={styles.title}>Mục Tiêu Thể Hình Của Bạn</Text>
            <Text style={styles.subtitle}>AI sẽ cá nhân hóa giáo án theo mục tiêu này.</Text>

            {GOALS.map((goal) => (
              <Pressable
                key={goal.id}
                onPress={() => setSelectedGoal(goal.id)}
                style={[styles.optionCard, selectedGoal === goal.id && styles.optionCardSelected]}
              >
                <Text
                  style={[
                    styles.optionTitle,
                    selectedGoal === goal.id && styles.optionTitleSelected,
                  ]}
                >
                  {goal.title}
                </Text>
                <Text style={styles.optionDesc}>{goal.desc}</Text>
              </Pressable>
            ))}

            <Button onPress={() => setStep(2)} size="large" style={styles.nextBtn}>
              Tiếp tục
            </Button>
          </Card>
        ) : null}

        {/* Step 2: Body Stats */}
        {step === 2 ? (
          <Card style={styles.card}>
            <Text style={styles.title}>Thể Số Cơ Thể</Text>
            <Text style={styles.subtitle}>
              Dùng để tính toán lượng calo và tải trọng khởi điểm.
            </Text>

            <Text style={styles.label}>Chiều cao (cm)</Text>
            <TextInput
              keyboardType="numeric"
              onChangeText={setHeightCm}
              style={styles.input}
              value={heightCm}
            />

            <Text style={styles.label}>Cân nặng (kg)</Text>
            <TextInput
              keyboardType="numeric"
              onChangeText={setWeightKg}
              style={styles.input}
              value={weightKg}
            />

            <View style={styles.buttonRow}>
              <Button onPress={() => setStep(1)} style={styles.flexBtn} variant="secondary">
                Quay lại
              </Button>
              <Button onPress={() => setStep(3)} style={styles.flexBtn} variant="primary">
                Tiếp tục
              </Button>
            </View>
          </Card>
        ) : null}

        {/* Step 3: Equipment */}
        {step === 3 ? (
          <Card style={styles.card}>
            <Text style={styles.title}>Thiết Bị Tập Luyện Có Sẵn</Text>
            <Text style={styles.subtitle}>
              FITAI sẽ chỉ gợi ý bài tập tương thích với phòng gym của bạn.
            </Text>

            <View style={styles.chipContainer}>
              {EQUIPMENTS.map((eq) => {
                const isSelected = selectedEquipments.includes(eq.id);
                return (
                  <Pressable
                    key={eq.id}
                    onPress={() => toggleEquipment(eq.id)}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {eq.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.buttonRow}>
              <Button onPress={() => setStep(2)} style={styles.flexBtn} variant="secondary">
                Quay lại
              </Button>
              <Button onPress={() => setStep(4)} style={styles.flexBtn} variant="primary">
                Tiếp tục
              </Button>
            </View>
          </Card>
        ) : null}

        {/* Step 4: Schedule */}
        {step === 4 ? (
          <Card style={styles.card}>
            <Text style={styles.title}>Lịch Tập Trong Tuần</Text>
            <Text style={styles.subtitle}>Chọn các ngày bạn có thể đến phòng tập.</Text>

            <View style={styles.chipContainer}>
              {WEEKDAYS.map((w) => {
                const isSelected = selectedDays.includes(w.id);
                return (
                  <Pressable
                    key={w.id}
                    onPress={() => toggleDay(w.id)}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {w.day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.buttonRow}>
              <Button onPress={() => setStep(3)} style={styles.flexBtn} variant="secondary">
                Quay lại
              </Button>
              <Button onPress={handleFinish} style={styles.flexBtn} variant="primary">
                Hoàn tất & Khởi tạo
              </Button>
            </View>
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: "row",
    gap: theme.spacing[3],
    marginTop: theme.spacing[6],
  },
  card: {
    padding: theme.spacing[6],
  },
  chip: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.surface,
    borderWidth: 1,
    marginBottom: theme.spacing[2],
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    width: "48%",
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: theme.spacing[4],
  },
  chipSelected: {
    backgroundColor: "rgba(75, 87, 242, 0.2)",
    borderColor: theme.colors.relayBlue,
  },
  chipText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  chipTextSelected: {
    color: theme.colors.text,
  },
  flexBtn: {
    flex: 1,
  },
  input: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.input,
    borderWidth: 1,
    color: theme.colors.text,
    fontSize: 16,
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
  nextBtn: {
    marginTop: theme.spacing[6],
  },
  optionCard: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.surface,
    borderWidth: 1,
    marginBottom: theme.spacing[3],
    padding: theme.spacing[4],
  },
  optionCardSelected: {
    backgroundColor: "rgba(75, 87, 242, 0.15)",
    borderColor: theme.colors.relayBlue,
  },
  optionDesc: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  optionTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  optionTitleSelected: {
    color: theme.colors.relayBlue,
  },
  progressBar: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radius.round,
    height: 4,
    marginTop: theme.spacing[2],
    overflow: "hidden",
    width: "100%",
  },
  progressFill: {
    backgroundColor: theme.colors.relayBlue,
    height: "100%",
  },
  progressHeader: {
    marginBottom: theme.spacing[6],
  },
  safeArea: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing[4],
  },
  stepIndicator: {
    color: theme.colors.relayBlue,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: theme.spacing[4],
  },
  title: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: theme.spacing[1],
  },
});
