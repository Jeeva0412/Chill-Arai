/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: ['selector', '[data-theme="dark"]'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            },
            borderRadius: {
                '2xl': '1rem',
                '3xl': '1.5rem',
                '4xl': '2rem',
            },
            colors: {
                // Phase 7 design tokens
                'bg-app': 'var(--bg-app)',
                'bg-header': 'var(--bg-header)',
                'bg-surface': 'var(--bg-surface)',
                'bg-icon': 'var(--bg-icon)',
                'accent-gold': 'var(--accent-primary)',
                // Legacy tokens
                'bg-primary': 'var(--bg-primary)',
                'bg-secondary': 'var(--bg-secondary)',
                'bg-tertiary': 'var(--bg-tertiary)',
                'text-primary': 'var(--text-primary)',
                'text-secondary': 'var(--text-secondary)',
                'text-muted': 'var(--text-muted)',
                'accent-primary': 'var(--accent-primary)',
                'accent-primary-hover': 'var(--accent-primary-hover)',
                'accent-success': 'var(--accent-success)',
                'accent-danger': 'var(--accent-danger)',
                'accent-warning': 'var(--accent-warning)',
                'accent-info': 'var(--accent-info)',
            },
            boxShadow: {
                'card': '0 2px 16px rgba(27, 25, 20, 0.06)',
                'card-hover': '0 8px 32px rgba(27, 25, 20, 0.12)',
            }
        },
    },
    plugins: [],
}
