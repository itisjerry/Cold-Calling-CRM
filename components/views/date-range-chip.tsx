"use client";
import * as React from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { DATE_RANGE_PRESETS, resolveDateRange } from "@/lib/date-range";
import type { DateRange, DateRangePreset } from "@/types";

interface Props {
  value: DateRange;
  onChange: (r: DateRange) => void;
  className?: string;
}

export function DateRangeChip({ value, onChange, className }: Props) {
  const [open, setOpen] = React.useState(false);
  const resolved = resolveDateRange(value);

  const [customStart, setCustomStart] = React.useState<string>(
    value.preset === "custom" && value.start ? value.start.slice(0, 10) : ""
  );
  const [customEnd, setCustomEnd] = React.useState<string>(
    value.preset === "custom" && value.end ? value.end.slice(0, 10) : ""
  );

  const pickPreset = (p: DateRangePreset) => {
    if (p === "custom") {
      // keep open for custom input
      onChange({ preset: "custom", start: customStart || new Date().toISOString(), end: customEnd || new Date().toISOString() });
      return;
    }
    onChange({ preset: p });
    setOpen(false);
  };

  const applyCustom = () => {
    if (!customStart || !customEnd) return;
    onChange({ preset: "custom", start: new Date(customStart).toISOString(), end: new Date(customEnd).toISOString() });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn("h-9", className)}>
          <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
          <span className="text-sm">{resolved.label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-3" align="start">
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick ranges</div>
          <div className="grid grid-cols-2 gap-1">
            {DATE_RANGE_PRESETS.filter((p) => p.value !== "custom").map((p) => (
              <button
                key={p.value}
                onClick={() => pickPreset(p.value)}
                className={cn(
                  "rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
                  value.preset === p.value && "bg-primary/10 text-primary font-medium"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Custom range</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px]">Start</Label>
                <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-[10px]">End</Label>
                <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="h-8 text-xs" />
              </div>
            </div>
            <Button size="sm" className="w-full mt-2 h-8" onClick={applyCustom} disabled={!customStart || !customEnd}>
              Apply custom range
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
