# Memo Graph

A beautiful memory book creator for parents. Build, design and order printed photo albums for your children.

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS v4
- **Backend/DB**: Supabase (auth, database, storage)
- **Payments**: Razorpay
- **Email**: Resend API
- **Hosting**: Vercel

## Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd memo-graph
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Where to get it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase project → Settings → API |
| `VITE_RAZORPAY_KEY_ID` | Razorpay Dashboard → Settings → API Keys |
| `VITE_RESEND_API_KEY` | resend.com → API Keys |
| `VITE_ADMIN_EMAIL` | Your admin email for order notifications |

### 3. Supabase setup

1. Run the full SQL schema (provided separately) in your Supabase SQL editor.
2. Go to **Storage** → create two **private** buckets:
   - `book-images`
   - `child-photos`
3. Go to **Authentication** → **Providers** → enable **Google** OAuth and add your Google Client ID and Secret.
4. Set your site URL in Supabase Auth settings to your Vercel domain.

### 4. Razorpay setup

1. Create an account at [razorpay.com](https://razorpay.com)
2. Go to Settings → API Keys → Generate Key
3. Use **Test mode** keys during development (prefix: `rzp_test_`)
4. Switch to **Live** keys for production (prefix: `rzp_live_`)

### 5. Resend setup

1. Create an account at [resend.com](https://resend.com)
2. Verify your sending domain (or use `onboarding@resend.dev` for testing)
3. Create an API key and set it as `VITE_RESEND_API_KEY`
4. Update `VITE_ADMIN_EMAIL` to where you want order notifications sent

### 6. Run locally

```bash
npm run dev
```

## Deploy to Vercel

### Option A — Vercel CLI

```bash
npm i -g vercel
vercel
```

Follow the prompts, then add environment variables in the Vercel dashboard.

### Option B — GitHub + Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
3. Set **Framework Preset** to `Vite`
4. Add all environment variables in the Vercel dashboard
5. Deploy

The `vercel.json` file already handles SPA routing (all paths → `/index.html`).

### After deploying

1. Copy your Vercel URL (e.g. `https://memo-graph.vercel.app`)
2. In Supabase → Authentication → URL Configuration:
   - **Site URL**: `https://memo-graph.vercel.app`
   - **Redirect URLs**: `https://memo-graph.vercel.app/**`
3. In Google Cloud Console (if using Google OAuth):
   - Add your Vercel URL to **Authorised JavaScript origins**
   - Add `https://<your-project>.supabase.co/auth/v1/callback` to **Authorised redirect URIs**

## Features

- 🔐 Email/password auth + Google OAuth
- 👶 Child profile management
- 📖 Memory book creation with size presets (1 Month, 1 Year Weekly, 1 Year Monthly, Custom)
- 🎨 Free-form canvas editor — drag, resize, double-click to edit text, upload images
- 🛒 Order flow with Razorpay payment
- 📦 Order tracking with status history
- 📧 Admin email notification on order with Resend
- 📱 Responsive design

## Colour Palette

| Name | Hex |
|---|---|
| Peach | `#FFCBA4` |
| Ivory | `#FFFFF0` |
| Eucalyptus | `#5C8B6E` |
| Pistachio | `#93C572` |
| Clay | `#B66A4A` |
