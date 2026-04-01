/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./App.tsx",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        app: {
          bg: "#F8F9FA",
          primary: "#3090C0",
          text: "#191C1D",
          muted: "#3C4A3C",
          tabInactive: {
            commandes: "#64748B",
            rapports: "#94A3B8",
            stock: "#6B7280",
          },
          cardStroke: "#BBCBB8",
        },
      },
      borderRadius: {
        app: "32px",
        pill: "9999px",
      },
      spacing: {
        appPad: "24px",
        appTop: "96px",
        sectionGap: "40px",
        gridColGap: "20px",
        gridRowGap: "4px",
      },
    },
  },
  plugins: [],
}