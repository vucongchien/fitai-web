import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useExerciseCatalog } from "../../src/features/exercise/model/exercise-catalog-store";
import { Badge } from "../../src/shared/components/ui/badge";
import { Card } from "../../src/shared/components/ui/card";
import { EmptyState } from "../../src/shared/components/ui/empty-state";
import { theme } from "../../src/shared/constants/theme";

const MUSCLE_CHIPS = [
  { id: "ALL", label: "Tất cả" },
  { id: "CHEST", label: "Ngực" },
  { id: "BACK", label: "Lưng" },
  { id: "LEGS", label: "Chân" },
  { id: "SHOULDERS", label: "Vai" },
] as const;

export default function ExerciseSearchModal() {
  const router = useRouter();
  const { exercises, setFilter } = useExerciseCatalog();

  const [query, setQuery] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<string>("ALL");

  const handleQueryChange = (text: string) => {
    setQuery(text);
    setFilter({ query: text });
  };

  const handleSelectMuscle = (muscle: string) => {
    setSelectedMuscle(muscle);
    setFilter({ targetMuscle: muscle as any });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.title}>Thư Viện Bài Tập</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.closeText}>Đóng</Text>
          </Pressable>
        </View>

        {/* Search input */}
        <TextInput
          onChangeText={handleQueryChange}
          placeholder="Tìm bài tập (ví dụ: Bench press, Squat, Ngực...)"
          placeholderTextColor={theme.colors.textMuted}
          style={styles.searchInput}
          value={query}
        />

        {/* Muscle filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
          {MUSCLE_CHIPS.map((chip) => {
            const isSelected = chip.id === selectedMuscle;
            return (
              <Pressable
                key={chip.id}
                onPress={() => handleSelectMuscle(chip.id)}
                style={[styles.filterChip, isSelected && styles.filterChipSelected]}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                  {chip.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Exercise list */}
        <ScrollView contentContainerStyle={styles.listContent}>
          {exercises.length > 0 ? (
            exercises.map((ex) => (
              <Card key={ex.id} style={styles.exCard}>
                <View style={styles.exRow}>
                  <View style={styles.exInfo}>
                    <Text style={styles.exName}>{ex.name}</Text>
                    <Text style={styles.exEquipment}>
                      {ex.equipment} • {ex.category}
                    </Text>
                    {ex.secondaryMuscles.length > 0 ? (
                      <Text style={styles.secondaryMuscles}>
                        Cơ phụ: {ex.secondaryMuscles.join(", ")}
                      </Text>
                    ) : null}
                  </View>
                  <Badge variant="primary">{ex.targetMuscle}</Badge>
                </View>
              </Card>
            ))
          ) : (
            <EmptyState
              description="Không tìm thấy bài tập nào khớp với tiêu chí tìm kiếm."
              icon="🔍"
              title="Không tìm thấy kết quả"
            />
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  chipsRow: {
    marginBottom: theme.spacing[4],
    paddingHorizontal: theme.spacing[4],
  },
  closeText: {
    color: theme.colors.relayBlue,
    fontSize: 15,
    fontWeight: "600",
  },
  container: {
    flex: 1,
  },
  exCard: {
    marginBottom: theme.spacing[3],
    padding: theme.spacing[4],
  },
  exEquipment: {
    color: theme.colors.relayBlue,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  exInfo: {
    flex: 1,
    paddingRight: theme.spacing[3],
  },
  exName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  exRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  filterChip: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.round,
    borderWidth: 1,
    marginRight: theme.spacing[2],
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
  },
  filterChipSelected: {
    backgroundColor: theme.colors.relayBlue,
    borderColor: theme.colors.relayBlue,
  },
  filterChipText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  filterChipTextSelected: {
    color: "#ffffff",
  },
  listContent: {
    padding: theme.spacing[4],
    paddingBottom: theme.spacing[8],
  },
  safeArea: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  searchInput: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.input,
    borderWidth: 1,
    color: theme.colors.text,
    fontSize: 15,
    marginHorizontal: theme.spacing[4],
    marginVertical: theme.spacing[3],
    minHeight: 48,
    paddingHorizontal: theme.spacing[4],
  },
  secondaryMuscles: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  title: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[3],
  },
});
