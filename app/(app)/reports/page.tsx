"use client";
import * as React from "react";
import { useStore, useIsAdmin } from "@/lib/store";
import { ReportBuilder } from "@/components/reports/report-builder";
import { FileText } from "lucide-react";

export default function ReportsPage() {
  const currentUserId = useStore((s) => s.currentUserId);
  const isAdmin = useIsAdmin();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><FileText className="h-6 w-6" /> Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isAdmin
            ? "Generate branded PDF reports for the whole team or any agent."
            : "Generate a branded PDF report of your own performance for any date range."}
        </p>
      </div>

      <ReportBuilder forceAgentId={isAdmin ? undefined : currentUserId} />
    </div>
  );
}
