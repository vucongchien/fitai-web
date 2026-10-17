"use client";

import { RotateCcw } from "lucide-react";
import { useRef, useState } from "react";

import { useOtpCountdown } from "@/features/auth/model/use-otp-countdown";
import { Button } from "@/shared/ui/button";

interface OtpInputGroupProps {
  length?: number;
  expiresInSeconds?: number;
  disabled?: boolean;
  onComplete: (code: string) => void;
  onResend: () => void | Promise<unknown>;
  errorMessage?: string | null;
}

export function OtpInputGroup({
  length = 6,
  expiresInSeconds = 60,
  disabled = false,
  onComplete,
  onResend,
  errorMessage,
}: OtpInputGroupProps) {
  const [digits, setDigits] = useState<string[]>(() => Array(length).fill(""));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const { remainingSeconds, canResend, restart } = useOtpCountdown(expiresInSeconds);

  const handleResend = async () => {
    if (!canResend || disabled) {
      return;
    }
    const result = await onResend();
    if (result !== false) {
      setDigits(Array(length).fill(""));
      restart(expiresInSeconds);
      inputsRef.current[0]?.focus();
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    const char = value.slice(-1);
    if (char && !/^\d$/.test(char)) {
      return;
    }

    setDigits((prev) => {
      const next = [...prev];
      next[index] = char;
      if (next.every((d) => d.length === 1)) {
        onComplete(next.join(""));
      }
      return next;
    });

    if (char && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim();
    const numbersOnly = pasted.replace(/\D/g, "").slice(0, length);
    if (!numbersOnly) {
      return;
    }

    const nextDigits = Array(length).fill("");
    for (let i = 0; i < numbersOnly.length; i++) {
      nextDigits[i] = numbersOnly[i];
    }
    setDigits(nextDigits);

    const focusIndex = Math.min(numbersOnly.length, length - 1);
    inputsRef.current[focusIndex]?.focus();

    if (numbersOnly.length === length) {
      onComplete(numbersOnly);
    }
  };

  return (
    <div className="otp-container">
      <div className="otp-boxes" onPaste={handlePaste}>
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            aria-label={`Mã OTP số ${index + 1}`}
            autoComplete="one-time-code"
            className={`otp-box ${errorMessage ? "otp-box--error" : ""}`}
            disabled={disabled}
            inputMode="numeric"
            maxLength={1}
            onChange={(e) => handleDigitChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            pattern="[0-9]*"
            type="text"
            value={digits[index]}
          />
        ))}
      </div>

      {errorMessage ? <p className="otp-error-msg">{errorMessage}</p> : null}

      <div className="otp-footer">
        {canResend ? (
          <div className="otp-resend-action">
            <span className="otp-resend-tip">Didn&apos;t receive code?</span>
            <Button
              className="otp-resend-btn"
              disabled={disabled}
              loading={disabled}
              onClick={handleResend}
              size="medium"
              type="button"
              variant="quiet"
            >
              <RotateCcw aria-hidden="true" size={13} />
              <span>Resend code</span>
            </Button>
          </div>
        ) : (
          <span className="otp-countdown-text">
            Didn&apos;t receive code? Resend in <strong>{remainingSeconds}s</strong>
          </span>
        )}
      </div>
    </div>
  );
}
