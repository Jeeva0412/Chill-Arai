# Chill-arai - Money Management App

Chill-arai is a sleek, minimalistic, and intuitive money management web application designed to help you keep track of your personal finances, including daily expenses, incomes, and managing money you've lent out or borrowed from others.

## Features

- **Dashboard Overview**: Get a high-level view of your total revenue, expenses, money lent out, and money borrowed. Visual breakdowns using dynamic pie charts.
- **Transaction Manager**: Easily record and track your income and expenses. Includes search functionality and date-range filters to find specific transactions quickly.
- **Lending & Borrowing Logs**: Never forget who owes you money or who you owe money to. Manage lending and borrowing records grouped beautifully by person name, track the remaining balances, and mark records as settled/repaid.
- **Minimalistic UI with Dark Mode**: Enjoy a clean, distraction-free interface that supports both Light Mode and a deep, high-contrast Dark Mode. The theme preference is automatically persisted.
- **Offline Capable (Local Storage)**: Fully functional without a backend. Data is saved securely in your browser's local storage by default.
- **Supabase Integration**: Can be easily connected to Supabase for cloud synchronization and persistent database storage.

## Tech Stack

- **Frontend Framework**: [React 18](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)

## Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository (or extract the project folder):
   ```bash
   cd Money_Management
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

### (Optional) Supabase Setup

To enable cloud storage using Supabase:

1. Create a Supabase project and set up the following tables: `transactions`, `lendings`, and `borrowings`.
2. Rename the `.env.example` file to `.env` (or create a new `.env` file in the root directory).
3. Add your Supabase URL and Anon Key to the `.env` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. The application will automatically detect these keys and switch from local storage to using your Supabase database.

## Design Philosophy

The application follows a highly monochromatic, stark, and modern minimal aesthetic. It steps away from heavy colors, drop shadows, and glassmorphism in favor of distinct typography, sharp contrasts, and pure functional clarity. 
