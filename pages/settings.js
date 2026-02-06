import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GDPRSettings from '../components/GDPRSettings';

export default function Settings() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                router.push('/login');
                return;
            }
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh'
            }}>
                <div>Loading...</div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Settings - BridgeLang</title>
                <meta name="description" content="Manage your account settings and privacy" />
            </Head>

            <Navbar />

            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                padding: '4rem 1.5rem',
                minHeight: 'calc(100vh - 200px)'
            }}>
                <h1 style={{
                    fontSize: '2.5rem',
                    fontWeight: '700',
                    marginBottom: '0.5rem'
                }}>
                    Settings
                </h1>
                <p style={{ color: '#64748b', marginBottom: '3rem' }}>
                    Manage your account preferences and data
                </p>

                {user && <GDPRSettings userId={user.uid} />}
            </div>

            <Footer />
        </>
    );
}
