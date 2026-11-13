"use client";

import { useRef, useState } from "react";

import {
  getNotificationSettingsAction,
  type NotificationSettings,
  updateNotificationSettingsAction,
} from "@/features/notification/server/notification-actions";
import { TimeSelectPill } from "@/features/notification/ui/wheel-time-picker";
import { usePushRegistration } from "@/shared/push/use-push-registration";
import { toast } from "@/shared/ui/toast";

interface NotificationSettingsSectionProps {
  initialSettings: NotificationSettings | null;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enablePush: true,
  enableEmail: true,
  enableSms: true,
  quietHoursStart: "",
  quietHoursEnd: "",
};

interface ChannelToggleRowProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onToggle: (nextValue: boolean) => void;
}

function ChannelToggleRow({ id, label, description, checked, onToggle }: ChannelToggleRowProps) {
  return (
    <label
      htmlFor={id}
      className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer select-none"
    >
      <div className="min-w-0">
        <div className="text-[16px] font-bold text-neutral-800 leading-snug truncate">{label}</div>
        <div className="text-[13px] font-medium text-neutral-400 mt-0.5 truncate">
          {description}
        </div>
      </div>

      <span className="switch">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onToggle(e.target.checked)}
        />
        <span className="switch__track" aria-hidden="true" />
      </span>
    </label>
  );
}

export function NotificationSettingsSection({ initialSettings }: NotificationSettingsSectionProps) {
  const [loaded, setLoaded] = useState(initialSettings !== null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isSavingQuietHours, setIsSavingQuietHours] = useState(false);
  const [savedSettings, setSavedSettings] = useState<NotificationSettings>(
    initialSettings ?? DEFAULT_SETTINGS,
  );
  const [quietStart, setQuietStart] = useState(initialSettings?.quietHoursStart ?? "");
  const [quietEnd, setQuietEnd] = useState(initialSettings?.quietHoursEnd ?? "");
  const requestSeqRef = useRef(0);
  const { status: pushStatus, enable: enableBrowserPush } = usePushRegistration();

  const handleRetryLoad = async () => {
    if (isRetrying) {
      return;
    }
    setIsRetrying(true);
    try {
      const fresh = await getNotificationSettingsAction();
      setSavedSettings(fresh);
      setQuietStart(fresh.quietHoursStart);
      setQuietEnd(fresh.quietHoursEnd);
      setLoaded(true);
    } catch (err) {
      const message =
        err instanceof Error && err.message === "UNAUTHENTICATED"
          ? "Please log in again to load notification settings."
          : "Unable to load notification preferences right now.";
      toast.error(message);
    } finally {
      setIsRetrying(false);
    }
  };

  const persistSettings = async (
    nextSettings: NotificationSettings,
    rollbackSettings: NotificationSettings,
    options?: { showSuccessToast?: boolean },
  ) => {
    const seq = ++requestSeqRef.current;
    setSavedSettings(nextSettings);

    try {
      const result = await updateNotificationSettingsAction(nextSettings);
      if (seq !== requestSeqRef.current) {
        return false;
      }

      if (!result.success) {
        setSavedSettings(rollbackSettings);
        setQuietStart(rollbackSettings.quietHoursStart);
        setQuietEnd(rollbackSettings.quietHoursEnd);
        toast.error(result.message || "Failed to update notification settings.");
        return false;
      }

      if (options?.showSuccessToast) {
        toast.success("Quiet hours updated.");
      }
      return true;
    } catch {
      if (seq === requestSeqRef.current) {
        setSavedSettings(rollbackSettings);
        setQuietStart(rollbackSettings.quietHoursStart);
        setQuietEnd(rollbackSettings.quietHoursEnd);
        toast.error("Failed to update notification settings.");
      }
      return false;
    }
  };

  const handleToggleChannel = (
    key: "enablePush" | "enableEmail" | "enableSms",
    nextValue: boolean,
  ) => {
    if (key === "enablePush" && nextValue && pushStatus !== "granted") {
      void enableBrowserPush();
    }

    const nextSettings: NotificationSettings = {
      ...savedSettings,
      [key]: nextValue,
    };
    void persistSettings(nextSettings, savedSettings);
  };

  const quietHoursDirty =
    quietStart !== savedSettings.quietHoursStart || quietEnd !== savedSettings.quietHoursEnd;

  const handleSaveQuietHours = async () => {
    if ((quietStart && !quietEnd) || (!quietStart && quietEnd)) {
      toast.error("Please select both start and end times for Quiet Hours.");
      return;
    }

    setIsSavingQuietHours(true);
    try {
      await persistSettings(
        {
          ...savedSettings,
          quietHoursStart: quietStart,
          quietHoursEnd: quietEnd,
        },
        savedSettings,
        { showSuccessToast: true },
      );
    } finally {
      setIsSavingQuietHours(false);
    }
  };

  const handleClearQuietHours = async () => {
    setQuietStart("");
    setQuietEnd("");
    setIsSavingQuietHours(true);
    try {
      await persistSettings(
        {
          ...savedSettings,
          quietHoursStart: "",
          quietHoursEnd: "",
        },
        savedSettings,
        { showSuccessToast: true },
      );
    } finally {
      setIsSavingQuietHours(false);
    }
  };

  if (!loaded) {
    return (
      <section className="space-y-2">
        <h2 className="text-[15px] font-bold text-neutral-500 px-1 tracking-tight">
          Notification Channels
        </h2>
        <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-2xs px-5 py-4 flex items-center justify-between gap-3">
          <p className="text-[14px] font-medium text-neutral-500">
            Unable to load notification preferences right now.
          </p>
          <button
            type="button"
            disabled={isRetrying}
            onClick={() => void handleRetryLoad()}
            className="shrink-0 rounded-xl !border !border-solid !border-neutral-200 bg-neutral-50 px-3.5 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-100 disabled:opacity-50 cursor-pointer transition-colors"
          >
            {isRetrying ? "Retrying..." : "Retry"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-2">
      <h2 className="text-[15px] font-bold text-neutral-500 px-1 tracking-tight">
        Notification Channels
      </h2>
      <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-2xs divide-y divide-neutral-200/80">
        <ChannelToggleRow
          id="notif-push-toggle"
          label="Push Notifications"
          description={
            pushStatus === "denied" ? "Blocked in browser settings" : "Workout, meal, and PR alerts"
          }
          checked={savedSettings.enablePush}
          onToggle={(val) => handleToggleChannel("enablePush", val)}
        />
        <ChannelToggleRow
          id="notif-email-toggle"
          label="Email Notifications"
          description="Summaries and important updates"
          checked={savedSettings.enableEmail}
          onToggle={(val) => handleToggleChannel("enableEmail", val)}
        />
        <ChannelToggleRow
          id="notif-sms-toggle"
          label="SMS Notifications"
          description="Urgent reminders via text"
          checked={savedSettings.enableSms}
          onToggle={(val) => handleToggleChannel("enableSms", val)}
        />

        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[16px] font-bold text-neutral-800 leading-snug truncate">
                Quiet Hours
              </div>
              <div className="text-[13px] font-medium text-neutral-400 mt-0.5 truncate">
                Silence alerts during sleep or focus time
              </div>
            </div>

            {(quietStart || quietEnd) && (
              <button
                type="button"
                disabled={isSavingQuietHours}
                onClick={() => void handleClearQuietHours()}
                className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                Clear
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <TimeSelectPill
              label="From"
              value={quietStart}
              defaultHour="22"
              align="left"
              disabled={isSavingQuietHours}
              onChange={setQuietStart}
            />
            <TimeSelectPill
              label="To"
              value={quietEnd}
              defaultHour="07"
              align="right"
              disabled={isSavingQuietHours}
              onChange={setQuietEnd}
            />
          </div>

          {quietHoursDirty && (
            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                disabled={isSavingQuietHours}
                onClick={() => void handleSaveQuietHours()}
                className="h-9 w-full sm:w-auto rounded-xl bg-sky-500 px-4 text-[13px] font-bold text-white hover:bg-sky-600 active:scale-98 disabled:opacity-50 cursor-pointer transition-all"
              >
                {isSavingQuietHours ? "Saving..." : "Apply"}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
