# Setup Guide for Kora Point Markets

This is a React/TypeScript prediction market web application built with Vite and Supabase.

## Prerequisites

- Node.js (v18 or higher recommended)
- npm (comes with Node.js)
- A Supabase account (free tier works) or Supabase CLI for local development

## Quick Start

### Option 1: Using Supabase Cloud (Recommended for beginners)

1. **Create a Supabase Project**
   - Go to https://supabase.com and sign up/login
   - Click "New Project"
   - Note your project URL and anon key from Settings > API

2. **Run Database Migrations**
   - In your Supabase dashboard, go to SQL Editor
   - Run each migration file from the `supabase/migrations/` folder in order:
     - `20260101164859_cba62c26-8537-4bcd-99b5-061477c2c276.sql`
     - `20260101170540_db68b3c8-5575-41f3-a697-ff9003a8bc68.sql`
     - `20260104185734_6c53c555-2ff7-4d2b-810f-d56bed82aa20.sql`
     - `20260105200146_f05d296c-f97e-4cee-8a3e-f1e6aa199231.sql`
     - `20260106060602_bdf1fc73-a4d9-4998-88ca-d84bf8bfe327.sql`

3. **Configure Environment Variables**
   - Create a `.env` file in the root directory
   - Add your Supabase credentials:
     ```
     VITE_SUPABASE_URL=your_project_url_here
     VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
     ```

4. **Install Dependencies & Run**
   ```bash
   npm install
   npm run dev
   ```

### Option 2: Using Supabase CLI (Local Development)

1. **Install Supabase CLI**
   - Windows: `scoop bucket add supabase https://github.com/supabase/scoop-bucket.git`
   - Or download from: https://github.com/supabase/cli/releases

2. **Start Local Supabase**
   ```bash
   supabase start
   ```
   This will automatically run all migrations and give you local credentials.

3. **Update .env file**
   - Copy the URL and anon key from the `supabase start` output
   - Update your `.env` file

4. **Run the app**
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

- `src/` - React application source code
- `supabase/` - Supabase configuration and migrations
- `public/` - Static assets
- `.env` - Environment variables (create this file)

## Troubleshooting

- **Missing environment variables**: Make sure your `.env` file exists and has the correct Supabase credentials
- **Database errors**: Ensure all migrations have been run
- **Port already in use**: The dev server runs on port 5173 by default. Change it in `vite.config.ts` if needed

