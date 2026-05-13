"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useIsAdmin, useCurrentUser } from "@/lib/store";
import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/motion/page-transition";
import { BottomTabs } from "@/components/layout/bottom-tabs";
import { AppFooter } from "@/components/layout/app-footer";
import { NotificationListener } from "@/components/notification/notification-listener";
import { SessionGuard } from "@/components/auth/session-guard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = useIsAdmin();
  const currentUser = useCurrentUser();
  const router = useRouter();

  // Wait until store hydrates on client so we don't flash a guard while data is loading.
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);

  if (!hydrated) {
    return (
      <div className="flex h-screen h-[100dvh] w-full overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6 max-w-[1600px] mx-auto" />
          </main>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex h-screen h-[100dvh] w-full overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 overflow-y-auto">
            <div className="p-6 sm:p-12 max-w-xl mx-auto text-center">
              <ShieldOff className="h-12 w-12 mx-auto text-muted-foreground" />
              <h1 className="text-xl font-semibold mt-4">Admin access required</h1>
              <p className="text-sm text-muted-foreground mt-2">
                You are signed in as {currentUser?.full_name} ({currentUser?.role}). Switch to an admin
                from the top-right user picker to view this page.
              </p>
              <Button className="mt-4" onClick={() => router.push("/dashboard")}>Back to dashboard</Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <SessionGuard>
      <div className="flex h-screen h-[100dvh] w-full overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 overflow-y-auto pb-24 lg:pb-0">
            <div className="p-3 sm:p-4 lg:p-6 max-w-[1600px] mx-auto">
              <PageTransition>{children}</PageTransition>
              <AppFooter />
            </div>
          </main>
        </div>
        <BottomTabs />
        <NotificationListener />
      </div>
    </SessionGuard>
  );
}
