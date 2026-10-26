"use client";

import { Users } from "lucide-react";

import { AccountManagementView } from "@/features/admin/ui/account-management-view";

export default function AdminUsersPage() {
  return (
    <AccountManagementView
      accountRole="user"
      title="Member Management"
      description="View member profiles, biological metrics, account status, and wallet balances."
      badgeLabel="Members"
      infoColumnHeader="Member Info"
      emptyTitle="No members found"
      emptyDescription="Try adjusting your search query or status filter."
      icon={Users}
    />
  );
}
