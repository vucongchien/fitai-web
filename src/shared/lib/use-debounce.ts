"use client";

import { useEffect, useState } from "react";

/**
 * Custom hook debounce giá trị theo thời gian trễ (mặc định 250ms).
 * Giúp tránh lãng phí request network và server compute khi gõ phím liên tục.
 */
export function useDebounce<T>(value: T, delayMs: number = 250): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
