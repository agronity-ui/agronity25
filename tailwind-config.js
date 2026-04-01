tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                tipBlack: '#0a0a0a',
                tipDark: '#121212',
                tipYellow: '#eab308', // Yellow-500
                tipGlow: '#facc15',   // Yellow-400
                newsRed: '#cc0000',   // CNN Dark Red
            },
            fontFamily: {
                sans: ['Poppins', 'sans-serif'],
                serif: ['Merriweather', 'serif'],
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
                'float': 'float 3s ease-in-out infinite',
                'pop-in': 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                'spin-slow': 'spin 60s linear infinite',
            },
            keyframes: {
                glow: {
                    '0%': { boxShadow: '0 0 5px #eab308, 0 0 10px #eab308' },
                    '100%': { boxShadow: '0 0 20px #eab308, 0 0 30px #eab308' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                popIn: {
                    '0%': { opacity: 0, transform: 'scale(0.5)' },
                    '100%': { opacity: 1, transform: 'scale(1)' },
                }
            }
        }
    }
}
