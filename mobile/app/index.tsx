import { Redirect } from "expo-router";
import React, { useEffect } from "react";

import { authStore, useAuth } from "../src/features/auth/model/auth-store";
import { LoadingState } from "../src/shared/components/ui/loading-state";

export default function IndexScreen() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    void authStore.init();
  }, []);

  if (isLoading) {
    return <LoadingState fullscreen message="Đang khởi động FITAI..." />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/today" />;
  }

  return <Redirect href="/(auth)/login" />;
}
