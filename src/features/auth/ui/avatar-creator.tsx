"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";

import {
  generateMultiavatarSvg,
  generateRandomSeed,
  svgToDataUri,
} from "@/features/auth/model/use-multiavatar";
import { Button } from "@/shared/ui/button";

interface AvatarCreatorProps {
  name: string;
  onAvatarChange: (avatarUrl: string) => void;
  disabled?: boolean;
}

const PRESET_SEEDS = ["FitAthlete", "CyberRunner", "ZenWarrior", "ApexPower"];

export function AvatarCreator({ name, onAvatarChange, disabled = false }: AvatarCreatorProps) {
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [activeSeed, setActiveSeed] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const effectiveSeed = activeSeed || name.trim() || "FitAI-Athlete";
  const currentSvg = generateMultiavatarSvg(effectiveSeed);

  const handleRandomize = useCallback(() => {
    setCustomImage(null);
    const newSeed = generateRandomSeed();
    setActiveSeed(newSeed);
    const svg = generateMultiavatarSvg(newSeed);
    onAvatarChange(svgToDataUri(svg));
  }, [onAvatarChange]);

  const handlePresetSelect = useCallback(
    (seed: string) => {
      setCustomImage(null);
      setActiveSeed(seed);
      const svg = generateMultiavatarSvg(seed);
      onAvatarChange(svgToDataUri(svg));
    },
    [onAvatarChange],
  );

  const handleRevertToName = useCallback(() => {
    setCustomImage(null);
    setActiveSeed("");
    const svg = generateMultiavatarSvg(name.trim() || "FitAI-Athlete");
    onAvatarChange(svgToDataUri(svg));
  }, [name, onAvatarChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Kích thước ảnh không được vượt quá 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCustomImage(result);
        onAvatarChange(result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="avatar-creator">
      <div className="avatar-creator__stage">
        <div className="avatar-creator__circle">
          {customImage ? (
            <Image
              alt="Ảnh đại diện tải lên"
              className="avatar-creator__custom-img"
              height={96}
              src={customImage}
              unoptimized
              width={96}
            />
          ) : (
            <div
              aria-label="Hình đại diện ngẫu nhiên"
              className="avatar-creator__svg-wrap"
              dangerouslySetInnerHTML={{ __html: currentSvg }}
            />
          )}
        </div>
      </div>

      <div className="avatar-creator__actions">
        <Button
          className="avatar-action-btn"
          disabled={disabled}
          onClick={handleRandomize}
          size="medium"
          type="button"
          variant="secondary"
        >
          Đổi mẫu ngẫu nhiên
        </Button>

        <Button
          className="avatar-action-btn avatar-action-btn--secondary"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
          size="medium"
          type="button"
          variant="secondary"
        >
          Tải ảnh cá nhân
        </Button>

        {(customImage || activeSeed) && (
          <Button
            className="avatar-action-btn avatar-action-btn--ghost"
            disabled={disabled}
            onClick={handleRevertToName}
            size="medium"
            type="button"
            variant="quiet"
          >
            Dùng theo tên
          </Button>
        )}

        <input
          ref={fileInputRef}
          accept="image/*"
          className="sr-only"
          disabled={disabled}
          onChange={handleFileChange}
          type="file"
        />
      </div>

      <div className="avatar-creator__presets">
        <span className="avatar-presets-label">Gợi ý phong cách:</span>
        <div className="avatar-presets-list">
          {PRESET_SEEDS.map((seed, idx) => (
            <Button
              key={seed}
              className={`avatar-preset-chip ${activeSeed === seed ? "avatar-preset-chip--active" : ""}`}
              disabled={disabled}
              onClick={() => handlePresetSelect(seed)}
              size="medium"
              type="button"
              variant={activeSeed === seed ? "primary" : "quiet"}
            >
              Mẫu {idx + 1}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
