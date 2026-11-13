"use client";

import { Eye, EyeOff, Lock, X } from "lucide-react";
import { useState, type FormEvent } from "react";

import { changePasswordAction } from "@/features/auth/server/auth-actions";

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  const handleClose = () => {
    if (isSubmitting) return;
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setSuccessMessage(null);
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!oldPassword) {
      setError("Current password is required.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (oldPassword === newPassword) {
      setError("New password must be different from current password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await changePasswordAction(oldPassword, newPassword, confirmPassword);
      if (result.success) {
        setSuccessMessage(result.data.message);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(result.error);
      }
    } catch {
      setError("Failed to change password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-sky-500" />
            <h3 id="change-password-title" className="text-[16px] font-bold text-neutral-900">
              Change Password
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close modal"
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-700">
              {successMessage}
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="old-password"
              className="block text-[13px] font-semibold text-neutral-700"
            >
              Current Password
            </label>
            <div className="flex items-center rounded-xl border border-neutral-200 bg-neutral-50/50 focus-within:border-sky-500 focus-within:bg-white">
              <input
                id="old-password"
                type={showOld ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full flex-1 bg-transparent px-3 py-2.5 text-[14px] text-neutral-900 outline-none"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowOld((prev) => !prev)}
                aria-label={showOld ? "Hide current password" : "Show current password"}
                className="shrink-0 pr-3 text-neutral-400 hover:text-neutral-600 cursor-pointer"
              >
                {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="new-password"
              className="block text-[13px] font-semibold text-neutral-700"
            >
              New Password
            </label>
            <div className="flex items-center rounded-xl border border-neutral-200 bg-neutral-50/50 focus-within:border-sky-500 focus-within:bg-white">
              <input
                id="new-password"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full flex-1 bg-transparent px-3 py-2.5 text-[14px] text-neutral-900 outline-none"
                placeholder="At least 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowNew((prev) => !prev)}
                aria-label={showNew ? "Hide new password" : "Show new password"}
                className="shrink-0 pr-3 text-neutral-400 hover:text-neutral-600 cursor-pointer"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="confirm-password"
              className="block text-[13px] font-semibold text-neutral-700"
            >
              Confirm New Password
            </label>
            <div className="flex items-center rounded-xl border border-neutral-200 bg-neutral-50/50 focus-within:border-sky-500 focus-within:bg-white">
              <input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full flex-1 bg-transparent px-3 py-2.5 text-[14px] text-neutral-900 outline-none"
                placeholder="Re-enter new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                className="shrink-0 pr-3 text-neutral-400 hover:text-neutral-600 cursor-pointer"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-xl border border-neutral-200 px-4 py-2 text-[14px] font-semibold text-neutral-600 hover:bg-neutral-50 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-sky-500 px-4 py-2 text-[14px] font-semibold text-white hover:bg-sky-600 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
