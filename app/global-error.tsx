"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", fontFamily: "system-ui, sans-serif" }}>
          <div style={{ maxWidth: 480, textAlign: "center" }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Application crashed</h1>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 16 }}>{error.message || "Unknown error"}</p>
            <button
              onClick={reset}
              style={{ padding: "0.5rem 1rem", borderRadius: 6, border: "1px solid #cbd5e1", background: "#0f172a", color: "white", cursor: "pointer" }}
            >
              Reload
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
