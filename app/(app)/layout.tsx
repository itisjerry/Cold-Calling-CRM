import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { OnboardingBanner } from "@/components/layout/onboarding-banner";
import { UpdateRequestBanner } from "@/components/agent/update-request-banner";
import { PageTransition } from "@/components/motion/page-transition";
import { BottomTabs } from "@/components/layout/bottom-tabs";
import { AppFooter } from "@/components/layout/app-footer";
import { NotificationListener } from "@/components/notification/notification-listener";
import { SessionGuard } from "@/components/auth/session-guard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionGuard>
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <OnboardingBanner />
          <UpdateRequestBanner />
          <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
            <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
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
