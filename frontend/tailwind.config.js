/** @type {import("tailwindcss").Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui"]
      },
      colors: {
        studio: {
          bg: "#eef0f4",
          panel: "#ffffff",
          text: "#1c2230",
          muted: "#8692a9",
          primary: "#6e3df5",
          soft: "#f3f5fb"
        }
      },
      boxShadow: {
        soft: "0 14px 30px rgba(31, 41, 55, 0.07)",
        glow: "0 12px 26px rgba(110, 61, 245, 0.3)"
      },
      borderRadius: {
        xl2: "1.35rem",
        xl3: "1.8rem"
      }
    }
  },
  plugins: []
};
