import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { nutritionStore, useNutrition } from "../../src/features/nutrition/model/nutrition-store";
import { Badge } from "../../src/shared/components/ui/badge";
import { Button } from "../../src/shared/components/ui/button";
import { Card } from "../../src/shared/components/ui/card";
import { EmptyState } from "../../src/shared/components/ui/empty-state";
import { ErrorState } from "../../src/shared/components/ui/error-state";
import { LoadingState } from "../../src/shared/components/ui/loading-state";
import { theme } from "../../src/shared/constants/theme";

export default function NutritionScreen() {
  const router = useRouter();
  const { error, isLoading, meals, targetCalories, targetCarbs, targetFat, targetProtein } =
    useNutrition();

  if (isLoading) {
    return <LoadingState fullscreen message="Đang nạp dữ liệu dinh dưỡng..." />;
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState message={error} onRetry={() => nutritionStore.setError(null)} />
      </SafeAreaView>
    );
  }

  const currentCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  const currentProtein = meals.reduce((sum, m) => sum + m.protein, 0);
  const currentCarbs = meals.reduce((sum, m) => sum + m.carbs, 0);
  const currentFat = meals.reduce((sum, m) => sum + m.fat, 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Dinh Dưỡng & Macro</Text>
          <Text style={styles.screenSubtitle}>
            Theo dõi năng lượng nạp vào so với mục tiêu thể hình
          </Text>
        </View>

        {/* Calorie & Macro Target Card */}
        <Card style={styles.macroCard}>
          <View style={styles.calRow}>
            <View>
              <Text style={styles.calLabel}>NĂNG LƯỢNG HÔM NAY</Text>
              <Text style={styles.calValue}>
                {currentCalories} <Text style={styles.calUnit}>/ {targetCalories} kcal</Text>
              </Text>
            </View>
            <Button
              onPress={() => router.push("/nutrition/log-meal")}
              size="medium"
              variant="primary"
            >
              + Ghi Chép Bữa
            </Button>
          </View>

          {/* Detailed Progress Bars */}
          <View style={styles.barGroup}>
            <View style={styles.barItem}>
              <View style={styles.barLabelRow}>
                <Text style={styles.barName}>🥩 Đạm (Protein)</Text>
                <Text style={styles.barCount}>
                  {currentProtein} / {targetProtein}g
                </Text>
              </View>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    {
                      backgroundColor: theme.colors.relayBlue,
                      width: `${Math.min(100, (currentProtein / targetProtein) * 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.barItem}>
              <View style={styles.barLabelRow}>
                <Text style={styles.barName}>🍚 Tinh bột (Carbs)</Text>
                <Text style={styles.barCount}>
                  {currentCarbs} / {targetCarbs}g
                </Text>
              </View>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    {
                      backgroundColor: theme.colors.sprintCoral,
                      width: `${Math.min(100, (currentCarbs / targetCarbs) * 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.barItem}>
              <View style={styles.barLabelRow}>
                <Text style={styles.barName}>🥑 Chất béo (Fat)</Text>
                <Text style={styles.barCount}>
                  {currentFat} / {targetFat}g
                </Text>
              </View>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    {
                      backgroundColor: theme.colors.fieldGreen,
                      width: `${Math.min(100, (currentFat / targetFat) * 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </Card>

        {/* Meals Section */}
        <Text style={styles.sectionTitle}>DANH SÁCH MÓN ĐÃ NẠP</Text>

        {meals.length > 0 ? (
          meals.map((meal) => (
            <Card key={meal.id} style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <View>
                  <Text style={styles.slotText}>
                    {meal.slot} • {meal.loggedAt}
                  </Text>
                  <Text style={styles.mealName}>{meal.name}</Text>
                </View>
                <Badge variant="primary">{meal.calories} kcal</Badge>
              </View>

              <View style={styles.mealMacroDetails}>
                <Text style={styles.macroDetailText}>P: {meal.protein}g</Text>
                <Text style={styles.macroDetailText}>C: {meal.carbs}g</Text>
                <Text style={styles.macroDetailText}>F: {meal.fat}g</Text>
                <Pressable
                  onPress={() => nutritionStore.deleteMeal(meal.id)}
                  style={styles.deleteAction}
                >
                  <Text style={styles.deleteText}>Xóa</Text>
                </Pressable>
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
            description="Bạn chưa ghi nhận món ăn nào hôm nay. Hãy bắt đầu ghi chép để kiểm soát calo."
            icon="🥑"
            title="Chưa có món ăn nào"
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  barCount: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  barGroup: {
    gap: theme.spacing[3],
    marginTop: theme.spacing[4],
  },
  barItem: {},
  barLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  barName: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  calLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  calRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  calUnit: {
    color: theme.colors.textMuted,
    fontSize: 15,
    fontWeight: "400",
  },
  calValue: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 2,
  },
  deleteAction: {
    marginLeft: "auto",
  },
  deleteText: {
    color: theme.colors.danger,
    fontSize: 12,
    fontWeight: "600",
  },
  fill: {
    borderRadius: theme.radius.round,
    height: "100%",
  },
  header: {
    marginBottom: theme.spacing[6],
  },
  macroCard: {
    marginBottom: theme.spacing[6],
    padding: theme.spacing[5],
  },
  macroDetailText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    marginRight: theme.spacing[3],
  },
  mealCard: {
    marginBottom: theme.spacing[3],
    padding: theme.spacing[4],
  },
  mealHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  mealMacroDetails: {
    alignItems: "center",
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    marginTop: theme.spacing[3],
    paddingTop: theme.spacing[2],
  },
  mealName: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "600",
    marginTop: 2,
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
  slotText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  track: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radius.round,
    height: 6,
    overflow: "hidden",
    width: "100%",
  },
});
