import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      fontFamily: {
        sans: ['var(--font-noto-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-noto-serif)', 'Georgia', 'serif'],
      },
      fontSize: {
        base: 'var(--font-size-base)',
      },
      lineHeight: {
        base: 'var(--line-height-base)',
        heading: 'var(--line-height-heading)',
      },
      maxWidth: {
        prose: 'var(--max-line-length)',
      },
    },
  },
  plugins: [],
} satisfies Config;

