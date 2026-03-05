# BridgeLang

A Next.js-based language learning platform connecting students with teachers.

## Tech Stack

- **Framework**: Next.js 15 (Pages Router)
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **Storage**: Firebase Storage
- **Payments**: Stripe
- **Email**: Nodemailer (SMTP via Brevo)
- **Styling**: SCSS Modules + Bootstrap 5 + Tailwind CSS

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Firebase (Client)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin
FIREBASE_SERVICE_ACCOUNT_JSON=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Email (SMTP)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
ADMIN_NOTIFY_EMAIL=
MAIL_FROM=

# App
NEXT_PUBLIC_BASE_URL=
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=
```

## Deploy on Vercel

Connect the repository to [Vercel](https://vercel.com) and add the environment variables above in the Vercel dashboard.

The `vercel.json` file includes cron jobs for lesson reminders, notifications, and cleanup tasks.
