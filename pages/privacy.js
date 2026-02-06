import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function PrivacyPolicy() {
    return (
        <>
            <Head>
                <title>Privacy Policy - BridgeLang</title>
                <meta name="description" content="BridgeLang privacy policy and data protection information" />
            </Head>

            <Navbar />

            <div style={{ maxWidth: '900px', margin: '4rem auto', padding: '0 1.5rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem' }}>
                    Privacy Policy
                </h1>
                <p style={{ color: '#64748b', marginBottom: '3rem' }}>
                    Last updated: {new Date().toLocaleDateString()}
                </p>

                <div style={{ lineHeight: '1.8', color: '#334155' }}>
                    <h2>1. Information We Collect</h2>
                    <p>We collect information you provide directly to us, including:</p>
                    <ul>
                        <li>Account information (name, email, password)</li>
                        <li>Profile information (bio, profile picture, teaching credentials)</li>
                        <li>Booking and payment information</li>
                        <li>Messages and communications</li>
                        <li>Usage data and analytics</li>
                    </ul>

                    <h2>2. How We Use Your Information</h2>
                    <p>We use your information to:</p>
                    <ul>
                        <li>Provide and improve our services</li>
                        <li>Process bookings and payments</li>
                        <li>Facilitate communication between students and teachers</li>
                        <li>Send important updates and notifications</li>
                        <li>Prevent fraud and ensure security</li>
                    </ul>

                    <h2>3. Data Sharing</h2>
                    <p>We share your data with:</p>
                    <ul>
                        <li><strong>Payment processors:</strong> Stripe (for payment processing)</li>
                        <li><strong>Video platform:</strong> Daily.co (for video lessons)</li>
                        <li><strong>Email service:</strong> For transactional emails</li>
                        <li><strong>Analytics:</strong> For improving our service</li>
                    </ul>
                    <p>We never sell your personal data to third parties.</p>

                    <h2>4. Your Rights (GDPR)</h2>
                    <p>Under GDPR, you have the right to:</p>
                    <ul>
                        <li><strong>Access:</strong> Request a copy of your data</li>
                        <li><strong>Rectification:</strong> Correct inaccurate data</li>
                        <li><strong>Erasure:</strong> Request deletion of your data</li>
                        <li><strong>Portability:</strong> Export your data in a readable format</li>
                        <li><strong>Object:</strong> Object to certain processing activities</li>
                    </ul>
                    <p>To exercise these rights, contact us at privacy@bridgelang.com</p>

                    <h2>5. Data Security</h2>
                    <p>We implement industry-standard security measures including:</p>
                    <ul>
                        <li>Encrypted data transmission (SSL/TLS)</li>
                        <li>Secure password hashing</li>
                        <li>Regular security audits</li>
                        <li>Access controls and monitoring</li>
                    </ul>

                    <h2>6. Cookies</h2>
                    <p>We use essential cookies for:</p>
                    <ul>
                        <li>Authentication and session management</li>
                        <li>Security and fraud prevention</li>
                        <li>Analytics and performance monitoring</li>
                    </ul>
                    <p>You can manage cookie preferences in your browser settings.</p>

                    <h2>7. Data Retention</h2>
                    <p>We retain your data for as long as needed to:</p>
                    <ul>
                        <li>Provide our services</li>
                        <li>Comply with legal obligations</li>
                        <li>Resolve disputes</li>
                        <li>Enforce our agreements</li>
                    </ul>
                    <p>Deleted accounts are anonymized, with transaction records kept for 7 years for legal compliance.</p>

                    <h2>8. Children's Privacy</h2>
                    <p>Our service is not intended for users under 16. We do not knowingly collect data from children.</p>

                    <h2>9. Changes to This Policy</h2>
                    <p>We may update this policy periodically. Significant changes will be notified via email.</p>

                    <h2>10. Contact Us</h2>
                    <p>For privacy questions or concerns:</p>
                    <ul>
                        <li>Email: privacy@bridgelang.com</li>
                        <li>Address: [Your Company Address]</li>
                    </ul>
                </div>

                <div style={{ marginTop: '3rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '8px' }}>
                    <h3>Quick Links</h3>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <Link href="/terms" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                            Terms of Service
                        </Link>
                        <span>|</span>
                        <a href="/api/user/export-data?userId=YOUR_ID" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                            Export My Data
                        </a>
                        <span>|</span>
                        <Link href="/contact" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                            Contact Us
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
