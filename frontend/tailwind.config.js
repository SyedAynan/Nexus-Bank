/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#20d3ee',
                    50: '#f0fdfe',
                    100: '#ccfbf1',
                    200: '#99f6e4',
                    300: '#5eead4',
                    400: '#2dd4bf',
                    500: '#20d3ee',
                    600: '#0891b2',
                    700: '#0e7490',
                    800: '#155e75',
                    900: '#164e63',
                },
                nexa: {
                    gold: '#c8a961',
                    dark: '#050816',
                    navy: '#0a0f2e',
                    surface: '#0d1340',
                    cyan: '#22d3ee',
                    violet: '#a78bfa',
                    emerald: '#34d399',
                    rose: '#fb7185',
                    amber: '#fbbf24',
                },
                'bg-dark': '#101f22',
                'bg-light': '#f6f8f8',
            },
            fontFamily: {
                display: ['Orbitron', 'Inter', 'sans-serif'],
                sans: ['Inter', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            animation: {
                'glow-pulse': 'glow-breathe 3s ease-in-out infinite',
                'float': 'float-particle 8s ease-in-out infinite',
            },
        },
    },
    plugins: [],
}
