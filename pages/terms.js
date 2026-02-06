import Head from 'next/head';
import Link from 'next/link';
import NavbarSwitcher from '../components/NavbarSwitcher';
import Footer from '../components/Footer';

export default function TermsOfService() {
    return (
        <>
            <Head>
                <title>Terms of Service - BridgeLang</title>
                <meta name="description" content="BridgeLang terms of service and usage guidelines" />
            </Head>

            <NavbarSwitcher />

            <div style={{ maxWidth: '900px', margin: '4rem auto', padding: '0 1.5rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem' }}>
                    Terms of Service
                </h1>
                <p style={{ color: '#64748b', marginBottom: '3rem' }}>
                    Last updated: {new Date().toLocaleDateString()}
                </p>

                <div style={{ lineHeight: '1.8', color: '#334155' }}>
                    <h2>1. Acceptance of Terms</h2>
                    <p>
                        By accessing or using BridgeLang, you agree to be bound by these Terms of Service and all applicable laws.
                        If you do not agree, please do not use our service.
                    </p>

                    <h2>2. User Accounts</h2>
                    <ul>
                        <li>You must be at least 16 years old to create an account</li>
                        <li>You are responsible for maintaining account security</li>
                        <li>One person or entity may not maintain more than one account</li>
                        <li>You must provide accurate and complete registration information</li>
                    </ul>

                    <h2>3. Booking and Payments</h2>
                    <h3>Payment Processing</h3>
                    <ul>
                        <li>Payments are processed securely through Stripe</li>
                        <li>Payment is held in escrow until lesson completion</li>
                        <li>Teachers receive 85% of the lesson price</li>
                        <li>Platform retains 15% as a service fee</li>
                    </ul>

                    <h3>Cancellation Policy</h3>
                    <ul>
                        <li><strong>More than 24 hours before:</strong> 100% refund</li>
                        <li><strong>12-24 hours before:</strong> 50% refund</li>
                        <li><strong>Less than 12 hours:</strong> No refund</li>
                        <li><strong>Teacher cancellation:</strong> Always 100% refund</li>
                    </ul>

                    <h3>Rescheduling</h3>
                    <ul>
                        <li>Either party may request to reschedule</li>
                        <li>Other party must approve the change</li>
                        <li>Original video room will be deleted and new one created</li>
                    </ul>

                    <h2>4. User Conduct</h2>
                    <p>You agree not to:</p>
                    <ul>
                        <li>Use the service for any illegal purpose</li>
                        <li>Harass, threaten, or abuse other users</li>
                        <li>Share inappropriate content</li>
                        <li>Attempt to bypass security measures</li>
                        <li>Scrape or copy data without permission</li>
                        <li>Create fake reviews or ratings</li>
                    </ul>

                    <h2>5. Teacher Responsibilities</h2>
                    <ul>
                        <li>Provide accurate credentials and qualifications</li>
                        <li>Conduct lessons professionally</li>
                        <li>Arrive on time for scheduled lessons</li>
                        <li>Provide quality educational content</li>
                        <li>Maintain appropriate conduct during video lessons</li>
                    </ul>

                    <h2>6. Student Responsibilities</h2>
                    <ul>
                        <li>Attend booked lessons on time</li>
                        <li>Respect teachers and their expertise</li>
                        <li>Provide honest feedback and reviews</li>
                        <li>Cancel with appropriate notice when necessary</li>
                    </ul>

                    <h2>7. Intellectual Property</h2>
                    <ul>
                        <li>BridgeLang owns all platform content and design</li>
                        <li>Teachers retain copyright of their lesson materials</li>
                        <li>Students may not record or redistribute lessons without permission</li>
                    </ul>

                    <h2>8. Disclaimers</h2>
                    <ul>
                        <li>Platform is provided "as is" without warranties</li>
                        <li>We do not guarantee lesson quality or teacher qualifications</li>
                        <li>We are not liable for disputes between users</li>
                        <li>Video service availability depends on Daily.co</li>
                    </ul>

                    <h2>9. Limitation of Liability</h2>
                    <p>
                        BridgeLang shall not be liable for any indirect, incidental, or consequential damages arising from use of the platform.
                        Our total liability shall not exceed the amount paid by you in the last 12 months.
                    </p>

                    <h2>10. Termination</h2>
                    <p>We reserve the right to:</p>
                    <ul>
                        <li>Suspend or terminate accounts for violations</li>
                        <li>Refuse service to anyone</li>
                        <li>Remove content that violates these terms</li>
                    </ul>

                    <h2>11. Dispute Resolution</h2>
                    <ul>
                        <li>Disputes should first be addressed through our support team</li>
                        <li>Unresolved issues may be subject to binding arbitration</li>
                        <li>Governed by the laws of [Your Jurisdiction]</li>
                    </ul>

                    <h2>12. Changes to Terms</h2>
                    <p>
                        We may update these terms at any time. Significant changes will be notified via email.
                        Continued use after changes constitutes acceptance.
                    </p>

                    <h2>13. Contact</h2>
                    <p>For questions about these terms:</p>
                    <ul>
                        <li>Email: support@bridgelang.com</li>
                        <li>Address: [Your Company Address]</li>
                    </ul>
                </div>

                <div style={{ marginTop: '3rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '8px' }}>
                    <h3>Quick Links</h3>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <Link href="/privacy" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                            Privacy Policy
                        </Link>
                        <span>|</span>
                        <Link href="/contact" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                            Contact Support
                        </Link>
                    </div>
                </div>
            </div>

            <Footer />

            <style jsx>{`
        h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
          color: #0f172a;
        }
        h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: #1e293b;
        }
        p {
          margin-bottom: 1rem;
        }
        ul {
          margin-left: 1.5rem;
          margin-bottom: 1rem;
        }
        li {
          margin-bottom: 0.5rem;
        }
      `}</style>
        </>
    );
}
