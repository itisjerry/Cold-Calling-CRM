"use client";
import * as React from "react";
import { useSearchParams } from "next/navigation";
import { ReportBuilder } from "@/components/reports/report-builder";
import { FileText } from "lucide-react";

export default function AdminReportsPage() {
  const search = useSearchParams();
  const initialAgent = search?.get("agent") ?? undefined;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><FileText className="h-6 w-6" /> Reports — admin</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate branded PDF reports for the whole team, a specific agent, or a custom slice.
        </p>
      </div>

      <ReportBuilder initialAgentId={initialAgent} />
    </div>
  );
}
