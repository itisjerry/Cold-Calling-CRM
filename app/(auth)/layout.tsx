export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary via-indigo-600 to-cold p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center font-bold text-xl">H</div>
          <span className="text-lg font-semibold">Helio CRM</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold tracking-tight leading-tight max-w-md">The calling command center for modern agencies.</h1>
          <p className="mt-4 text-white/80 max-w-md">Timezone-aware queues, one-click dispositions, automatic follow-up rhythm, and a clean handoff from qualified lead to active project.</p>
        </div>
        <div className="text-xs text-white/60">© Helio CRM — built for closers.</div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
