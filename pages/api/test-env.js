export default function handler(req, res) {
  res.status(200).json({
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY?.substring(0, 10) + '...',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 10) + '...',
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    PROJECT_ID_ALT: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  });
}
