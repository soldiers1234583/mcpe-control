/** @type {import('tailwindcss').Config} */
import animate from "tailwindcss-animate";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0b0e14",
        foreground: "#e6edf3",
        card: "#141a24",
        "card-border": "#232c3b",
        muted: "#8b98a9",
        accent: "#4c8bf5",
        success: "#2fbf71",
        danger: "#e5534b",
        warn: "#e3b341",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      animation: {
        spotlight: "spotlight 2s ease .75s 1 forwards",
        shimmer: "shimmer 2s linear infinite",
        "background-position-spin": "background-position-spin 3000ms linear infinite",
        aurora: "aurora 60s linear infinite",
        scroll: "scroll var(--animation-duration, 40s) var(--animation-direction, forwards) linear infinite",
        marquee: "marquee var(--duration,30s) linear infinite",
        first: "moveVertical 6s ease-in-out infinite alternate",
        second: "moveAnimation18s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        "background-position-spin": {
          "0%": { backgroundPosition: "top center" },
          "100%": { backgroundPosition: "bottom center" },
        },
        aurora: {
          from: { backgroundPosition: "50% 50%", backgroundSize: "200% 200%" },
          to: { backgroundPosition: "173% 50%", backgroundSize: "400% 400%" },
        },
        spotlight: {
          "0%": { opacity: 0, transform: "translate(-72%, -62%) scale(0.5)" },
          "100%": { opacity: 1, transform: "translate(-50%,-40%) scale(1)" },
        },
        scroll: {
          to: { transform: "translate(calc(-50% - 0.5rem))" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(calc(-100% - var(--gap)))" },
        },
        moveVertical: {
          "0%": { transform: "translateY(-50%)" },
          "100%": { transform: "translateY(50%)" },
        },
        move: {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(50%)" },
        },
      },
    },
  },
  plugins: [animate],
};
