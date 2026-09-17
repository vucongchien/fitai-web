import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Badge } from "../../src/shared/components/ui/badge";
import { Button } from "../../src/shared/components/ui/button";
import { Card } from "../../src/shared/components/ui/card";
import { theme } from "../../src/shared/constants/theme";

export default function WorkoutSummaryScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Celebration Header */}
        <View style={styles.header}>
          <Text style={styles.trophy}>🏆</Text>
          <Text style={styles.title}>Hoàn Thành Buổi Tập!</Text>
          <Text style={styles.subtitle}>Bạn đã hoàn thành xuất sắc giáo án tập luyện hôm nay.</Text>
        </View>

        {/* PR Achievement Banner */}
        <Card style={styles.prCard}>
          <Badge variant="warning">KỶ LỤC MỚI (PR)</Badge>
          <Text style={styles.prTitle}>Barbell Bench Press: 85 kg</Text>
          <Text style={styles.prDesc}>Vượt qua kỷ lục cũ +2.5kg! Ước tính 1RM đạt 105 kg.</Text>
        </Card>

        {/* Big Metrics Grid */}
        <View style={styles.metricsGrid}>
          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>TỔNG KHỐI LƯỢNG</Text>
            <Text style={styles.metricVal}>
              4.8 <Text style={styles.metricUnit}>Tấn</Text>
            </Text>
            <Text style={styles.metricSub}>+12% so với tuần trước</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>THỜI LƯỢNG TẬP</Text>
            <Text style={styles.metricVal}>
              48 <Text style={styles.metricUnit}>phút</Text>
            </Text>
            <Text style={styles.metricSub}>Nghỉ TB: 75s / set</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>TỔNG SỐ HIỆP</Text>
            <Text style={styles.metricVal}>
              14 <Text style={styles.metricUnit}>sets</Text>
            </Text>
            <Text style={styles.metricSub}>4 bài tập</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>ĐIỂM KỸ THUẬT (FORM)</Text>
            <Text style={styles.metricVal}>
              94 <Text style={styles.metricUnit}>/ 100</Text>
            </Text>
            <Text style={styles.metricSub}>AI chấm điểm xuất sắc</Text>
          </Card>
        </View>

        {/* Back to Today Button */}
        <Button
          onPress={() => router.replace("/(tabs)/today")}
          size="large"
          style={styles.doneBtn}
          variant="primary"
        >
          ✓ Về Màn Hình Chính
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  doneBtn: {
    marginTop: theme.spacing[4],
  },
  header: {
    alignItems: "center",
    marginBottom: theme.spacing[6],
  },
  metricCard: {
    padding: theme.spacing[4],
    width: "48%",
  },
  metricLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricSub: {
    color: theme.colors.fieldGreen,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  metricUnit: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: "400",
  },
  metricVal: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: "4%",
    justifyContent: "space-between",
    marginBottom: theme.spacing[6],
    rowGap: theme.spacing[3],
  },
  prCard: {
    backgroundColor: "rgba(255, 90, 71, 0.08)",
    borderColor: "rgba(255, 90, 71, 0.3)",
    marginBottom: theme.spacing[5],
    padding: theme.spacing[4],
  },
  prDesc: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  prTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: "700",
    marginTop: theme.spacing[2],
  },
  safeArea: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing[4],
    paddingBottom: theme.spacing[10],
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 14,
    marginTop: theme.spacing[2],
    textAlign: "center",
  },
  title: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: "900",
    marginTop: theme.spacing[3],
  },
  trophy: {
    fontSize: 56,
  },
});
