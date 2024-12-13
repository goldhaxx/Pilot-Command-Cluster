/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
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
        eve: {
          blue: "#00b3ee",
          darkblue: "#1c262f",
          gray: "#cccccc",
          darkgray: "#888888",
          red: "#ff4444",
          green: "#00ff00",
        }
      },
      fontSize: {
        'eve-small': ['0.75rem', '1rem'],
        'eve-normal': ['0.875rem', '1.25rem'],
        'eve-large': ['1rem', '1.5rem'],
        'eve-xl': ['1.25rem', '1.75rem'],
      },
      backgroundImage: {
        'eve-gradient': 'linear-gradient(45deg, #0a0a0a 0%, #1a1a1a 100%)',
        'eve-window': 'linear-gradient(180deg, rgba(28, 38, 47, 0.95) 0%, rgba(20, 27, 33, 0.95) 100%)',
      },
      boxShadow: {
        'eve': '0 0 10px rgba(0, 179, 238, 0.1)',
        'eve-hover': '0 0 15px rgba(0, 179, 238, 0.2)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    function({ addUtilities }) {
      addUtilities({
        '.eve-text-shadow': {
          'text-shadow': '0 0 4px rgba(0, 179, 238, 0.3)',
        },
        '.eve-border': {
          'border': '1px solid rgba(0, 179, 238, 0.2)',
        },
        '.eve-focus-ring': {
          'box-shadow': '0 0 0 2px rgba(0, 179, 238, 0.3)',
        },
      });
    },
  ],
}

