import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ['"Inter Display"', "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        hot: "hsl(var(--hot))",
        warm: "hsl(var(--warm))",
        cold: "hsl(var(--cold))",
        success: "hsl(var(--success))",
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "elevation-1": "var(--elevation-1)",
        "elevation-2": "var(--elevation-2)",
        "elevation-3": "var(--elevation-3)",
        "elevation-4": "var(--elevation-4)",
        "elevation-5": "var(--elevation-5)",
        "glow-primary": "0 0 0 1px hsl(var(--primary) / 0.4), 0 4px 24px -4px hsl(var(--glow-primary))",
        "glow-success": "0 0 0 1px hsl(var(--success) / 0.4), 0 4px 24px -4px hsl(var(--glow-success))",
        "glow-hot":     "0 0 0 1px hsl(var(--hot)     / 0.4), 0 4px 24px -4px hsl(var(--glow-hot))",
        "inner-hl":     "inset 0 1px 0 0 hsl(0 0% 100% / 0.18)",
        "inner-hl-strong": "inset 0 1px 0 0 hsl(0 0% 100% / 0.28)",
      },
      transitionTimingFunction: {
        ios: "cubic-bezier(0.32, 0.72, 0, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      transitionDuration: {
        fast: "120ms",
        base: "200ms",
        slow: "320ms",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up":   { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        shimmer: {
          "0%":   { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        "ripple": {
          "0%":   { transform: "scale(0)",   opacity: "0.45" },
          "100%": { transform: "scale(2.4)", opacity: "0"    },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.85" },
          "50%":      { opacity: "0.55" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        shimmer: "shimmer 1.6s infinite",
        "fade-in-up": "fade-in-up var(--duration-base) var(--ease-out-expo) both",
        "scale-in":   "scale-in var(--duration-base) var(--ease-spring) both",
        ripple:       "ripple 600ms var(--ease-out-expo) forwards",
        "pulse-soft": "pulse-soft 2.4s ease-in-out infinite",
      },
      backdropBlur: {
        xs: "4px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
