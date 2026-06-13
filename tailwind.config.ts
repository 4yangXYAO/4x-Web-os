import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'os-black': '#000000',
        'os-white': '#FFFFFF',
        'os-gray': '#1A1A1A',
        'os-accent': '#00FF00', // Cyberpunk neon green
        'os-border': '#FFFFFF'
      },
      fontFamily: {
        monofrik: ['Monofrik', 'monospace']
      },
      borderColor: {
        'os-line': '#FFFFFF'
      },
      backgroundColor: {
        'os-window': '#000000',
        'os-taskbar': '#000000'
      }
    }
  },
  plugins: []
} satisfies Config;
