"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <div className="mx-auto h-14 w-14 rounded-full bg-rose-500/10 flex items-center justify-center">
          <AlertTriangle className="h-7 w-7 text-rose-600" />
        </div>
        <h1 className="text-xl font-bold">Something broke.</h1>
        <p className="text-sm text-muted-foreground">{error.message || "Unknown error"}</p>
        {error.digest && <p className="text-[10px] text-muted-foreground font-mono">{error.digest}</p>}
        <div className="flex gap-2 justify-center">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>Back to dashboard</Button>
        </div>
      </div>
    </div>
  );
}
