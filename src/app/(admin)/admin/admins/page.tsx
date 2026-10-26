"use client";

import { ShieldCheck } from "lucide-react";

import { AccountManagementView } from "@/features/admin/ui/account-management-view";

export default function AdminStaffPage() {
  return (
    <AccountManagementView
      accountRole="admin"
      title="Admin Staff Management"
      description="View administrator accounts, control panel permissions, and security status."
      badgeLabel="Admins"
      infoColumnHeader="Admin Info"
      emptyTitle="No administrators found"
      emptyDescription="Try adjusting your search query or status filter."
      icon={ShieldCheck}
    />
  );
}
