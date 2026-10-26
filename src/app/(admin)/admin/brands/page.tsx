"use client";

import { Building2, FileCheck2 } from "lucide-react";
import { useState } from "react";

import { AccountManagementView } from "@/features/admin/ui/account-management-view";
import { BrandRequestsTable } from "@/features/admin/ui/brand-requests-table";

export default function AdminBrandsPage() {
  const [activeTab, setActiveTab] = useState<"accounts" | "requests">("accounts");

  return (
    <div className="space-y-6">
      {/* Top Tab Bar for Brand Management */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("accounts")}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "accounts"
              ? "bg-[var(--color-action)] text-[var(--color-action-contrast)] shadow-xs"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)]"
          }`}
        >
          <Building2 className="size-3.5" />
          <span>Active Brands</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("requests")}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "requests"
              ? "bg-[var(--color-action)] text-[var(--color-action-contrast)] shadow-xs"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)]"
          }`}
        >
          <FileCheck2 className="size-3.5" />
          <span>Onboarding Requests</span>
        </button>
      </div>

      {activeTab === "accounts" ? (
        <AccountManagementView
          accountRole="brand"
          title="Brand Partner Management"
          description="View commercial brand accounts, sponsor profiles, and partnership status."
          badgeLabel="Brands"
          infoColumnHeader="Brand Info"
          emptyTitle="No brand partners found"
          emptyDescription="Try adjusting your search query or status filter."
          icon={Building2}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text)] flex items-center gap-2 font-display">
                <FileCheck2 className="size-5 text-[var(--color-action)]" />
                <span>Brand Onboarding Requests</span>
              </h1>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Review and approve/reject partner registration applications directly from
                gym-companion.
              </p>
            </div>
          </div>

          <BrandRequestsTable />
        </div>
      )}
    </div>
  );
}
