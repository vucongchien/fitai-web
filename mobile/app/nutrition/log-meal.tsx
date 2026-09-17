import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { nutritionStore } from "../../src/features/nutrition/model/nutrition-store";
import { Button } from "../../src/shared/components/ui/button";
import { Card } from "../../src/shared/components/ui/card";
import { theme } from "../../src/shared/constants/theme";

const SLOTS = [
  { id: "BREAKFAST", label: "Bữa Sáng" },
  { id: "LUNCH", label: "Bữa Trưa" },
  { id: "DINNER", label: "Bữa Tối" },
  { id: "SNACK", label: "Bữa Phụ" },
] as const;

const PRESETS = [
  { calories: 330, carbs: 0, fat: 5, name: "Ức gà áp chảo (200g)", protein: 62 },
  { calories: 195, carbs: 43, fat: 1, name: "Cơm trắng (150g)", protein: 4 },
  { calories: 155, carbs: 1, fat: 11, name: "Trứng gà luộc (2 quả)", protein: 13 },
  { calories: 120, carbs: 2, fat: 1.5, name: "Whey Protein Isolate (1 muỗng)", protein: 25 },
  { calories: 350, carbs: 60, fat: 4, name: "Yến mạch chuối mật ong", protein: 12 },
];

export default function LogMealModal() {
  const router = useRouter();

  const [slot, setSlot] = useState<"BREAKFAST" | "DINNER" | "LUNCH" | "SNACK">("LUNCH");
  const [mealName, setMealName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const handleApplyPreset = (preset: (typeof PRESETS)[0]) => {
    setMealName(preset.name);
    setCalories(String(preset.calories));
    setProtein(String(preset.protein));
    setCarbs(String(preset.carbs));
    setFat(String(preset.fat));
  };

  const handleSaveMeal = () => {
    if (!mealName.trim()) {
      return;
    }

    nutritionStore.logMeal({
      calories: parseInt(calories, 10) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      name: mealName.trim(),
      protein: parseFloat(protein) || 0,
      slot,
    });

    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Modal Top Bar */}
        <View style={styles.topBar}>
          <Text style={styles.modalTitle}>Ghi Chép Bữa Ăn</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.closeText}>Đóng</Text>
          </Pressable>
        </View>

        {/* Slot Selector */}
        <View style={styles.slotRow}>
          {SLOTS.map((s) => {
            const isSelected = s.id === slot;
            return (
              <Pressable
                key={s.id}
                onPress={() => setSlot(s.id)}
                style={[styles.slotChip, isSelected && styles.slotChipSelected]}
              >
                <Text style={[styles.slotChipText, isSelected && styles.slotChipTextSelected]}>
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Preset Recommendations */}
        <Text style={styles.sectionTitle}>GỢI Ý MÓN PHỔ BIẾN</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
          {PRESETS.map((p) => (
            <Pressable key={p.name} onPress={() => handleApplyPreset(p)} style={styles.presetCard}>
              <Text style={styles.presetName}>{p.name}</Text>
              <Text style={styles.presetMeta}>
                {p.calories} kcal • {p.protein}g P
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Form Inputs */}
        <Card style={styles.formCard}>
          <Text style={styles.label}>Tên món ăn / Thực phẩm</Text>
          <TextInput
            onChangeText={setMealName}
            placeholder="Ví dụ: Bò xào hành tây, Sữa chua Hy Lạp..."
            placeholderTextColor={theme.colors.textMuted}
            style={styles.input}
            value={mealName}
          />

          <View style={styles.inputRow}>
            <View style={styles.inputCol}>
              <Text style={styles.label}>Calories (kcal)</Text>
              <TextInput
                keyboardType="numeric"
                onChangeText={setCalories}
                placeholder="350"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.input}
                value={calories}
              />
            </View>

            <View style={styles.inputCol}>
              <Text style={styles.label}>Đạm - Protein (g)</Text>
              <TextInput
                keyboardType="numeric"
                onChangeText={setProtein}
                placeholder="30"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.input}
                value={protein}
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputCol}>
              <Text style={styles.label}>Carbs (g)</Text>
              <TextInput
                keyboardType="numeric"
                onChangeText={setCarbs}
                placeholder="40"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.input}
                value={carbs}
              />
            </View>

            <View style={styles.inputCol}>
              <Text style={styles.label}>Chất béo - Fat (g)</Text>
              <TextInput
                keyboardType="numeric"
                onChangeText={setFat}
                placeholder="8"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.input}
                value={fat}
              />
            </View>
          </View>

          <Button
            disabled={!mealName.trim()}
            onPress={handleSaveMeal}
            size="large"
            style={styles.saveBtn}
            variant="primary"
          >
            Lưu Vào {SLOTS.find((s) => s.id === slot)?.label}
          </Button>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  closeText: {
    color: theme.colors.relayBlue,
    fontSize: 15,
    fontWeight: "600",
  },
  formCard: {
    padding: theme.spacing[5],
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
  inputCol: {
    flex: 1,
  },
  inputRow: {
    flexDirection: "row",
    gap: theme.spacing[3],
  },
  label: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: theme.spacing[1],
  },
  modalTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  presetCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.surface,
    borderWidth: 1,
    marginRight: theme.spacing[3],
    padding: theme.spacing[3],
    width: 170,
  },
  presetMeta: {
    color: theme.colors.relayBlue,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  presetName: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  presetScroll: {
    marginBottom: theme.spacing[5],
  },
  safeArea: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  saveBtn: {
    marginTop: theme.spacing[3],
  },
  scrollContent: {
    padding: theme.spacing[4],
    paddingBottom: theme.spacing[8],
  },
  sectionTitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: theme.spacing[3],
  },
  slotChip: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceSubtle,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.input,
    borderWidth: 1,
    flex: 1,
    paddingVertical: theme.spacing[2],
  },
  slotChipSelected: {
    backgroundColor: theme.colors.relayBlue,
    borderColor: theme.colors.relayBlue,
  },
  slotChipText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  slotChipTextSelected: {
    color: "#ffffff",
  },
  slotRow: {
    flexDirection: "row",
    gap: theme.spacing[2],
    marginBottom: theme.spacing[5],
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing[5],
  },
});
