/** Design tokens for Al Noor Books. Change brand colours here and everywhere follows. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#0B1F3A', 900: '#071629', 700: '#17365D' },
        ink: '#111827',
        muted: '#6B7280',
        line: '#E5E7EB',
        mist: '#F8FAFC',
        tint: '#EEF3F9', // pale blue panels (order summary, store section)
        whatsapp: '#1F8F55',
        danger: '#B42318',
      },
      fontFamily: {
        serif: ['"Libre Baskerville"', 'Georgia', '"Times New Roman"', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      maxWidth: { page: '1320px' },
    },
  },
  plugins: [],
};
