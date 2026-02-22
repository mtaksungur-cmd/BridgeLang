import Link from 'next/link';
import Image from 'next/image';
import { Clock, ShieldCheck, CheckCircle, ChevronLeft } from 'lucide-react';
import SeoHead from '../../components/SeoHead';

export default function PendingApproval() {
    return (
        <>
            <SeoHead title="Application Pending — BridgeLang" />
            <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)', display: 'flex', flexDirection: 'column' }}>
                <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '1rem 2rem' }}>
                    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center' }}>
                        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
                            <Image src="/bridgelang.png" alt="BridgeLang" width={40} height={40} />
                            <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>BridgeLang</span>
                        </Link>
                    </div>
                </header>

                <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <div style={{ width: '100%', maxWidth: '540px', background: 'white', borderRadius: '24px', padding: '3.5rem 3rem', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
                        <div style={{ width: '80px', height: '80px', background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', border: '3px solid #dbeafe' }}>
                            <Clock style={{ width: '40px', height: '40px', color: '#3b82f6' }} />
                        </div>
                        
                        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1e293b', marginBottom: '1rem' }}>
                            Application Under Review
                        </h1>
                        
                        <p style={{ fontSize: '1rem', color: '#64748b', marginBottom: '2.5rem', lineHeight: '1.7' }}>
                            Thank you for applying to BridgeLang! Our team is currently reviewing your profile and teaching documents. 
                            <br/><br/>
                            This process usually takes **1-2 business days**. We will notify you via email as soon as your account is approved.
                        </p>

                        <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '1.5rem', marginBottom: '2.5rem', textAlign: 'left', border: '1px solid #e2e8f0' }}>
                            <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#475569', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Next Steps:</h4>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9375rem', color: '#64748b' }}>
                                    <div style={{ width: '20px', height: '20px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <CheckCircle size={14} color="#22c55e" />
                                    </div>
                                    Profile Submitted
                                </li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9375rem', color: '#1e293b', fontWeight: '600' }}>
                                    <div style={{ width: '20px', height: '20px', background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #3b82f6' }}>
                                        <div style={{ width: '6px', height: '6px', background: '#3b82f6', borderRadius: '50%' }} />
                                    </div>
                                    Reviewing Qualifications
                                </li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9375rem', color: '#94a3b8' }}>
                                    <div style={{ width: '20px', height: '20px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ShieldCheck size={14} />
                                    </div>
                                    Stripe Account Activation
                                </li>
                            </ul>
                        </div>

                        <Link href="/">
                             <button style={{ width: '100%', padding: '1rem', background: 'white', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <ChevronLeft size={18} /> Return Home
                            </button>
                        </Link>
                    </div>
                </main>
            </div>
        </>
    );
}
