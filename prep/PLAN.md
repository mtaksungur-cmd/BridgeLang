# Bridgelang Phase 1 Development Plan

## 1. Environment & Setup
- [ ] Connect to Firebase Console (Waiting for invite)
- [ ] Connect to Vercel Team (Waiting for invite)
- [ ] Configure Stripe Test Mode keys

## 2. Pricing & Subscription Updates
- [ ] Update `pages/student/subscription.js` with new tiers (£0, £4.99, £9.99).
- [ ] Remove profile view limits (set to unlimited).
- [ ] Update messaging limits (5, 10, 20, Unlimited).
- [ ] Update Stripe Checkout metadata in `pages/api/payment/plan-checkout.js`.

## 3. GDPR & Reviews
- [ ] Add "I agree for my full name and profile photo..." checkbox to review forms.
- [ ] Implement logic to anonymize names (e.g., "Emily R.") if consent is not given.
- [ ] Add timestamped consent logging to Firestore.

## 4. Intro Lessons (15-min)
- [ ] Create 15-minute intro lesson product in Stripe.
- [ ] Add "15-min Intro Available" badge to Tutor Cards.
- [ ] Implement 1-per-tutor logic in booking backend.

## 5. Automated Communications (Brevo)
- [ ] Design/Update email templates in Brevo panel.
- [ ] Test 2FA/Login link flow.
- [ ] Test Welcome email flow for Students & Tutors.

## 6. Teacher Video Settings
- [ ] Add "Public Visibility" and "Social Media Use" toggles to Teacher Dashboard.
- [ ] Implement backend enforcement (don't show video if toggle is off).

## 7. Testing & Quality Assurance
- [ ] Run all scenarios from `file_108.pdf`.
- [ ] Record video proofs for each working feature.
- [ ] Deploy to Vercel Preview for client testing.
