"use client";

import { Building2 } from "lucide-react";

import { AccountManagementView } from "@/features/admin/ui/account-management-view";

export default function AdminBrandsPage() {
  return (
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
  );
}
