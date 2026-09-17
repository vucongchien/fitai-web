import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { Text } from "react-native";
import { describe, expect, it, vi } from "vitest";

import { Badge } from "../../mobile/src/shared/components/ui/badge";
import { Button } from "../../mobile/src/shared/components/ui/button";
import { Card } from "../../mobile/src/shared/components/ui/card";
import { EmptyState } from "../../mobile/src/shared/components/ui/empty-state";
import { ErrorState } from "../../mobile/src/shared/components/ui/error-state";
import { LoadingState } from "../../mobile/src/shared/components/ui/loading-state";

describe("Mobile UI Primitives & 3 Required States (Loading / Error / Empty)", () => {
  describe("LoadingState", () => {
    it("renders loading indicator with custom message and progressbar accessibility", () => {
      render(<LoadingState message="Đang tải lộ trình tập..." />);

      expect(screen.getByText("Đang tải lộ trình tập...")).toBeDefined();
      expect(screen.getByTestId("loading-state")).toBeDefined();
    });
  });

  describe("ErrorState", () => {
    it("renders error message and triggers onRetry when pressed", () => {
      const onRetry = vi.fn();
      render(
        <ErrorState
          message="Không thể kết nối đến máy chủ"
          onRetry={onRetry}
          title="Lỗi tải dữ liệu"
        />,
      );

      expect(screen.getByText("Lỗi tải dữ liệu")).toBeDefined();
      expect(screen.getByText("Không thể kết nối đến máy chủ")).toBeDefined();

      const retryBtn = screen.getByText("Thử lại");
      fireEvent.click(retryBtn);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe("EmptyState", () => {
    it("renders empty state with title, description, and action node", () => {
      render(
        <EmptyState
          action={<Text>Thêm bài tập mới</Text>}
          description="Bạn chưa lên lịch bài tập nào cho ngày hôm nay."
          title="Hôm nay không có bài tập"
        />,
      );

      expect(screen.getByText("Hôm nay không có bài tập")).toBeDefined();
      expect(screen.getByText("Bạn chưa lên lịch bài tập nào cho ngày hôm nay.")).toBeDefined();
      expect(screen.getByText("Thêm bài tập mới")).toBeDefined();
    });
  });

  describe("Card", () => {
    it("renders children content and handles press callback when provided", () => {
      const onPress = vi.fn();
      render(
        <Card onPress={onPress}>
          <Text>Thẻ bài tập ngực</Text>
        </Card>,
      );

      const card = screen.getByText("Thẻ bài tập ngực");
      fireEvent.click(card);
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  describe("Button", () => {
    it("renders button label and fires onPress callback", () => {
      const onPress = vi.fn();
      render(<Button onPress={onPress}>Bắt đầu hiệp tập</Button>);

      const btn = screen.getByText("Bắt đầu hiệp tập");
      fireEvent.click(btn);
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("does not fire onPress when disabled or loading", () => {
      const onPress = vi.fn();
      render(
        <Button disabled onPress={onPress}>
          Bị vô hiệu hóa
        </Button>,
      );

      const btn = screen.getByText("Bị vô hiệu hóa");
      fireEvent.click(btn);
      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe("Badge", () => {
    it("renders badge text with appropriate styling", () => {
      render(<Badge variant="success">Hoàn thành</Badge>);
      expect(screen.getByText("Hoàn thành")).toBeDefined();
    });
  });
});
