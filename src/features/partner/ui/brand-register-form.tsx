"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Building2, CheckCircle2, Loader2, LogIn, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  registerBrandAction,
  type RegisterBrandInput,
} from "@/features/partner/api/partner-brand-service";

const formSchema = z.object({
  brandName: z.string().trim().min(2, "Vui lòng nhập tên thương hiệu (ít nhất 2 ký tự)").max(120),
  description: z.string().trim().min(10, "Mô tả cần ít nhất 10 ký tự").max(1000),
  contactPhone: z
    .string()
    .trim()
    .min(8, "Vui lòng nhập số điện thoại hợp lệ")
    .max(20, "Số điện thoại tối đa 20 ký tự"),
  address: z.string().trim().min(5, "Vui lòng nhập địa chỉ (ít nhất 5 ký tự)").max(255),
});

export interface BrandRegisterFormProps {
  isAuthenticated: boolean;
  isBrandAccount: boolean;
  userName?: string;
}

export function BrandRegisterForm({
  isAuthenticated,
  isBrandAccount,
  userName,
}: BrandRegisterFormProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterBrandInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      brandName: "",
      description: "",
      contactPhone: "",
      address: "",
    },
  });

  if (isBrandAccount) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-action-soft)] text-[var(--color-action)] text-xs font-semibold">
          <ShieldCheck className="size-4" />
          Tài khoản Brand Partner đã kích hoạt
        </div>
        <h3 className="text-xl font-bold text-[var(--color-text)] font-display">
          Chào mừng trở lại{userName ? `, ${userName}` : ""}!
        </h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          Tài khoản của bạn đã được phê duyệt vai trò Brand Partner. Truy cập bảng điều khiển để
          theo dõi trạng thái đối tác và các tính năng sắp ra mắt.
        </p>
        <Link
          href="/partner/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-input)] bg-[var(--color-action)] text-[var(--color-action-contrast)] text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Vào Partner Dashboard
          <ArrowRight className="size-4" />
        </Link>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] text-xs font-semibold">
          <Building2 className="size-4" />
          Đăng ký Brand Partner
        </div>
        <h3 className="text-xl font-bold text-[var(--color-text)] font-display">
          Đăng nhập để gửi hồ sơ đối tác
        </h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          Hồ sơ Brand Partner được gắn với tài khoản FITAI của bạn để quản trị viên xét duyệt và cấp
          quyền trực tiếp.
        </p>
        <Link
          href="/login?redirect=/partner#register"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-input)] bg-[var(--color-action)] text-[var(--color-action-contrast)] text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <LogIn className="size-4" />
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  if (successMessage) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--color-recovery)]/40 bg-[var(--color-surface)] p-8 space-y-4">
        <div className="flex items-center gap-2 text-[var(--color-recovery)] font-semibold">
          <CheckCircle2 className="size-5" />
          <span>Gửi hồ sơ thành công</span>
        </div>
        <p className="text-sm text-[var(--color-text)]">{successMessage}</p>
        <p className="text-xs text-[var(--color-text-muted)]">
          Đội ngũ vận hành sẽ kiểm tra yêu cầu của bạn tại mục duyệt Brand Partners. Sau khi được
          duyệt, hãy đăng nhập lại để cập nhật quyền Brand.
        </p>
      </div>
    );
  }

  const onSubmit = (values: RegisterBrandInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await registerBrandAction(values);
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      setSuccessMessage(result.message);
      reset();
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 space-y-5"
    >
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-[var(--color-text)] font-display">
          Gửi hồ sơ đăng ký Brand Partner
        </h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          Đang đăng nhập với tài khoản{" "}
          <span className="font-medium text-[var(--color-text)]">{userName || "FITAI Member"}</span>
          .
        </p>
      </div>

      {serverError ? (
        <div
          role="alert"
          className="rounded-[var(--radius-input)] border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]"
        >
          {serverError}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="brandName" className="block text-sm font-medium text-[var(--color-text)]">
            Tên thương hiệu *
          </label>
          <input
            id="brandName"
            type="text"
            placeholder="VD: FitGear Vietnam"
            disabled={isPending}
            {...register("brandName")}
            className="w-full rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-action)]"
          />
          {errors.brandName ? (
            <p className="text-xs text-[var(--color-danger)]">{errors.brandName.message}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="contactPhone"
            className="block text-sm font-medium text-[var(--color-text)]"
          >
            Số điện thoại liên hệ *
          </label>
          <input
            id="contactPhone"
            type="tel"
            placeholder="VD: 0901234567"
            disabled={isPending}
            {...register("contactPhone")}
            className="w-full rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-action)]"
          />
          {errors.contactPhone ? (
            <p className="text-xs text-[var(--color-danger)]">{errors.contactPhone.message}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="address" className="block text-sm font-medium text-[var(--color-text)]">
          Địa chỉ doanh nghiệp / Phòng tập *
        </label>
        <input
          id="address"
          type="text"
          placeholder="VD: 123 Nguyễn Huệ, Quận 1, TP.HCM"
          disabled={isPending}
          {...register("address")}
          className="w-full rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-action)]"
        />
        {errors.address ? (
          <p className="text-xs text-[var(--color-danger)]">{errors.address.message}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="block text-sm font-medium text-[var(--color-text)]">
          Giới thiệu thương hiệu & Mục tiêu hợp tác *
        </label>
        <textarea
          id="description"
          rows={4}
          placeholder="Mô tả sản phẩm/dịch vụ fitness của bạn và hình thức muốn đồng hành cùng cộng đồng FITAI..."
          disabled={isPending}
          {...register("description")}
          className="w-full rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-action)]"
        />
        {errors.description ? (
          <p className="text-xs text-[var(--color-danger)]">{errors.description.message}</p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-[var(--radius-input)] bg-[var(--color-action)] text-[var(--color-action-contrast)] text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Đang gửi hồ sơ...
          </>
        ) : (
          <>
            Gửi yêu cầu đối tác
            <ArrowRight className="size-4" />
          </>
        )}
      </button>
    </form>
  );
}
