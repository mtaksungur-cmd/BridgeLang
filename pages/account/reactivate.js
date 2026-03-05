'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function ReactivatePage() {
    const router = useRouter();
    const { token, uid } = router.query;
    const [status, setStatus] = useState('loading'); // loading | success | error
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!router.isReady) return;

        if (!token || !uid) {
            setStatus('error');
            setMessage('Invalid or missing activation links.');
            return;
        }

        const performReactivation = async () => {
            try {
                const res = await fetch(`/api/account/reactivate_process?token=${token}&uid=${uid}`);
                const data = await res.json();

                if (res.ok) {
                    setStatus('success');
                } else {
                    setStatus('error');
                    setMessage(data.error || 'Reactivation failed. Link might be expired.');
                }
            } catch (err) {
                console.error(err);
                setStatus('error');
                setMessage('A technical error occurred. Please contact support.');
            }
        };

        performReactivation();
    }, [router.isReady, token, uid]);

    return (
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
                <div style={{ width: '100%', maxWidth: '480px', background: 'white', borderRadius: '16px', padding: '3rem', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                    
                    {status === 'loading' && (
                        <div>
                            <Loader2 style={{ width: '48px', height: '48px', color: '#3b82f6', margin: '0 auto 1.5rem', animation: 'spin 1s linear infinite' }} />
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem' }}>Verifying Account...</h2>
                            <p style={{ color: '#64748b' }}>Please wait while we reactivate your account.</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div>
                            <div style={{ width: '64px', height: '64px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <CheckCircle style={{ width: '32px', height: '32px', color: '#22c55e' }} />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e293b', marginBottom: '1rem' }}>Account Reactivated!</h2>
                            <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: '1.6' }}>
                                Your account is now active again. You can sign in to resume your English journey.
                            </p>
                            <Link href="/login">
                                <button style={{ width: '100%', padding: '0.875rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', transition: 'background 0.2s' }}>
                                    Sign In Now
                                </button>
                            </Link>
                        </div>
                    )}

                    {status === 'error' && (
                        <div>
                            <div style={{ width: '64px', height: '64px', background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <AlertCircle style={{ width: '32px', height: '32px', color: '#dc2626' }} />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e293b', marginBottom: '1rem' }}>Reactivation Failed</h2>
                            <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: '1.6' }}>
                                {message}
                            </p>
                            <Link href="/contact">
                                <button style={{ width: '100%', padding: '0.875rem', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
                                    Contact Support
                                </button>
                            </Link>
                        </div>
                    )}
                </div>
            </main>
            <style jsx>{` @keyframes spin { to { transform: rotate(360deg); } } `}</style>
        </div>
    );
}
