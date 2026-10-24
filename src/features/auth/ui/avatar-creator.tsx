"use client";

import { Camera } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

import { generateMultiavatarSvg } from "@/features/auth/model/use-multiavatar";

interface AvatarCreatorProps {
  name: string;
  onAvatarChange: (avatarUrl: string) => void;
  disabled?: boolean;
}

export function AvatarCreator({ name, onAvatarChange, disabled = false }: AvatarCreatorProps) {
  const [customImage, setCustomImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const effectiveSeed = name.trim() || "FitAI-Athlete";
  const currentSvg = generateMultiavatarSvg(effectiveSeed);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size cannot exceed 5MB.");
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
      <button
        aria-label="Upload custom photo"
        className="avatar-creator__stage"
        disabled={disabled}
        onClick={() => fileInputRef.current?.click()}
        title="Upload custom photo"
        type="button"
      >
        <div className="avatar-creator__circle">
          {customImage ? (
            <Image
              alt="Profile photo"
              className="avatar-creator__custom-img"
              height={88}
              src={customImage}
              unoptimized
              width={88}
            />
          ) : (
            <div
              aria-label="Profile avatar"
              className="avatar-creator__svg-wrap"
              dangerouslySetInnerHTML={{ __html: currentSvg }}
            />
          )}
          <span aria-hidden="true" className="avatar-creator__camera-badge">
            <Camera size={13} />
          </span>
        </div>
      </button>

      <input
        ref={fileInputRef}
        accept="image/*"
        className="sr-only"
        disabled={disabled}
        onChange={handleFileChange}
        type="file"
      />
    </div>
  );
}
