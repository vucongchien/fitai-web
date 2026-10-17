"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { Gender } from "@/shared/api/gen/contracts/generic/auth/v1/message/auth_messages_pb";
import { Button } from "@/shared/ui/button";

const AvatarCreator = dynamic(
  () => import("@/features/auth/ui/avatar-creator").then((mod) => mod.AvatarCreator),
  {
    ssr: false,
    loading: () => (
      <div aria-busy="true" className="avatar-creator avatar-creator--loading">
        <div className="avatar-creator__stage">
          <div className="avatar-creator__circle" />
        </div>
      </div>
    ),
  },
);

interface RegisterProfileSubformProps {
  isPending: boolean;
  onSubmit: (e: React.FormEvent, data: {
    fullName: string;
    password: string;
    gender: Gender;
    dateOfBirth: string;
    avatarUrl: string;
  }) => void;
}

export function RegisterProfileSubform({
  isPending,
  onSubmit,
}: RegisterProfileSubformProps) {
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [gender, setGender] = useState<Gender>(Gender.MALE);
  const [dateOfBirth, setDateOfBirth] = useState("2000-01-01");
  const [avatarUrl, setAvatarUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    onSubmit(e, {
      fullName,
      password,
      gender,
      dateOfBirth,
      avatarUrl,
    });
  };

  return (
    <form className="auth-step-profile-details" onSubmit={handleSubmit}>
      <div className="auth-profile-header">
        <h3 className="auth-step-title">Thiết lập tài khoản</h3>
        <p className="auth-step-desc">
          Tạo hồ sơ và chọn phong cách hình đại diện riêng của bạn.
        </p>
      </div>

      <AvatarCreator
        disabled={isPending}
        name={fullName}
        onAvatarChange={setAvatarUrl}
      />

      <div className="auth-field">
        <label className="auth-label" htmlFor="register-fullname">
          Họ và tên
        </label>
        <input
          id="register-fullname"
          autoComplete="name"
          className="auth-input"
          disabled={isPending}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="VD: Nguyễn Văn An"
          type="text"
          value={fullName}
        />
      </div>

      <div className="auth-field">
        <div className="auth-label-row">
          <label className="auth-label" htmlFor="register-password">
            Mật khẩu đăng nhập
          </label>
          <button
            className="auth-toggle-pwd-btn"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            type="button"
          >
            {showPassword ? "Ẩn" : "Hiện"}
          </button>
        </div>
        <input
          id="register-password"
          autoComplete="new-password"
          className="auth-input"
          disabled={isPending}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Tối thiểu 8 ký tự"
          type={showPassword ? "text" : "password"}
          value={password}
        />
      </div>

      <div className="auth-form-row">
        <div className="auth-field">
          <label className="auth-label">Giới tính</label>
          <div className="auth-gender-pills">
            {([Gender.MALE, Gender.FEMALE] as const).map((g) => (
              <button
                key={g}
                className={`auth-gender-pill ${gender === g ? "auth-gender-pill--active" : ""}`}
                disabled={isPending}
                onClick={() => setGender(g)}
                type="button"
              >
                {g === Gender.MALE ? "Nam" : "Nữ"}
              </button>
            ))}
          </div>
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="register-dob">
            Ngày sinh
          </label>
          <input
            id="register-dob"
            className="auth-input"
            disabled={isPending}
            max={new Date().toISOString().split("T")[0]}
            onChange={(e) => setDateOfBirth(e.target.value)}
            type="date"
            value={dateOfBirth}
          />
        </div>
      </div>

      <Button
        className="auth-submit-btn"
        disabled={!fullName.trim() || !password || isPending}
        loading={isPending}
        size="large"
        type="submit"
      >
        Hoàn tất tạo tài khoản
      </Button>
    </form>
  );
}
