# Hisaab

A family expense tracker. One person logs expenses, another reviews and rejects them. Built as a PWA so it works on phone like a normal app.

## What it does

- Members log daily expenses with an amount and description
- Expenses are approved by default
- Reviewers (e.g. mom) can open the app on their phone, see all expenses, and reject any they don't agree with
- Tracks pocket money given vs expenses spent, shows net due each month
- History of past months

## Tech stack

- React + Vite
- Supabase (auth + database + realtime)
- vite-plugin-pwa (installable on phone)

## Setup

1. Clone the repo and install dependencies
   ```
   npm install
   ```

2. Create a Supabase project at supabase.com, then run `supabase-schema.sql` in the SQL editor

3. Create a `.env` file in the root:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_REVIEWER_CODE=your_invite_code
   ```

4. Run the dev server
   ```
   npm run dev
   ```

## Roles

- **Member** — signs up normally, logs expenses
- **Reviewer** — signs up with the invite code (`VITE_REVIEWER_CODE`), can reject expenses and edit pocket money

## Deploy

```
npm run build
```

Then drag the `dist` folder to Vercel or Netlify. Add the same env variables in the platform's settings.
