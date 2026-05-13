"use client";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

export function OnboardingBanner() {
  const seeded = useStore((s) => s.seeded);
  const leadsLength = useStore((s) => s.leads.length);
  const loadSampleData = useStore((s) => s.loadSampleData);

  if (seeded || leadsLength > 0) return null;

  return (
    <div className="border-b bg-gradient-to-r from-primary/5 via-cold/5 to-transparent">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-2.5 flex items-center gap-3 flex-wrap">
        <Sparkles className="h-4 w-4 text-primary shrink-0" />
        <p className="text-sm flex-1 min-w-[240px]">
          <span className="font-medium">Welcome to Helio.</span>
          <span className="text-muted-foreground"> Load 40 demo agency leads to see the engine in action, or import your own CSV.</span>
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              loadSampleData();
              toast.success("Demo data loaded — 40 leads with realistic history");
            }}
          >
            Load demo data
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href="/import">Import CSV</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
