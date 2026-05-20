export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      animation: {
        'fade-up':     'fadeUp 0.45s ease both',
        'fade-in':     'fadeIn 0.35s ease both',
        'scale-in':    'scaleIn 0.3s ease both',
        'slide-right': 'slideRight 0.35s ease both',
        'shimmer':     'shimmer 2.2s linear infinite',
        'logo-glow':   'logoPulse 3s ease-in-out infinite',
        'float':       'float 6s ease-in-out infinite',
        'ping-slow':   'ping 2s cubic-bezier(0,0,0.2,1) infinite',
        'pulse-soft':  'pulseSoft 2.5s ease-in-out infinite',
        'count-up':    'fadeUp 0.5s ease both',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.94)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideRight: {
          '0%':   { opacity: '0', transform: 'translateX(-14px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        logoPulse: {
          '0%, 100%': { filter: 'drop-shadow(0 0 6px rgba(16,185,129,0.45))' },
          '50%':      { filter: 'drop-shadow(0 0 16px rgba(16,185,129,0.8))' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
    },
  },
  plugins: [],
};
