/** @type {import('tailwindcss').Config} */
// Ogni utility risolve su un token --tp-*: cambiare tema = cambiare data-theme.
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--tp-bg)',
        canvas: 'var(--tp-canvas)',
        surf: 'var(--tp-surf)',
        'surf-2': 'var(--tp-surf-2)',
        ink: 'var(--tp-ink)',
        mute: 'var(--tp-mute)',
        acc: 'var(--tp-acc)',
        'acc-2': 'var(--tp-acc-2)',
        'acc-ink': 'var(--tp-acc-ink)',
        line: 'var(--tp-line)',
      },
      backgroundImage: {
        grad: 'var(--tp-grad)',
        tex: 'var(--tp-tex)',
      },
      borderRadius: {
        DEFAULT: 'var(--tp-r)',
        sm: 'var(--tp-r-sm)',
        lg: 'var(--tp-r-lg)',
        btn: 'var(--tp-r-btn)',
      },
      borderWidth: {
        theme: 'var(--tp-bw)',
      },
      boxShadow: {
        theme: 'var(--tp-sh)',
        'theme-sm': 'var(--tp-sh-sm)',
      },
      fontFamily: {
        display: 'var(--tp-font-display)',
        body: 'var(--tp-font-body)',
        mono: 'var(--tp-font-mono)',
      },
      fontSize: {
        hero: 'var(--tp-hero)',
      },
      transitionDuration: {
        theme: 'var(--tp-dur)',
        'theme-slow': 'var(--tp-dur-slow)',
      },
      transitionTimingFunction: {
        theme: 'var(--tp-ease)',
      },
    },
  },
  plugins: [],
}
