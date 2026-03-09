/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
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
            }
        },
    },
    plugins: [],
}
