import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

// Try to load Firestore SEO overrides
let firestoreSeoCache = null;
let firestoreSeoLoaded = false;

export default function SeoHead({
    title = 'BridgeLang - Connect with Teachers Worldwide',
    description = 'Find and connect with qualified teachers for personalized online learning. Book lessons, chat with teachers, and improve your skills with BridgeLang.',
    ogImage = '/images/og-image.png',
    canonical,
    keywords = 'online tutoring, language teachers, online learning, private lessons'
}) {
    const router = useRouter();
    const [seoOverride, setSeoOverride] = useState(null);

    useEffect(() => {
        // Load Firestore SEO settings (cached after first load)
        const loadSeo = async () => {
            if (firestoreSeoLoaded) {
                if (firestoreSeoCache?.[router.pathname]) {
                    setSeoOverride(firestoreSeoCache[router.pathname]);
                }
                return;
            }
            try {
                const { getFirestore, doc, getDoc } = await import('firebase/firestore');
                const { db } = await import('../lib/firebase');
                const snap = await getDoc(doc(db, 'settings', 'seo'));
                if (snap.exists()) {
                    firestoreSeoCache = snap.data().pages || {};
                    if (firestoreSeoCache[router.pathname]) {
                        setSeoOverride(firestoreSeoCache[router.pathname]);
                    }
                }
            } catch {
                // Firestore not available, use defaults
            }
            firestoreSeoLoaded = true;
        };
        loadSeo();
    }, [router.pathname]);

    const finalTitle = seoOverride?.title || title;
    const finalDesc = seoOverride?.description || description;
    const finalOgImage = seoOverride?.ogImage || ogImage;
    const finalKeywords = seoOverride?.keywords || keywords;

    const fullTitle = finalTitle.includes('BridgeLang') ? finalTitle : `${finalTitle} | BridgeLang`;

    return (
        <Head>
            <title>{fullTitle}</title>
            <meta name="description" content={finalDesc} />
            <meta name="keywords" content={finalKeywords} />

            {/* Open Graph */}
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={finalDesc} />
            <meta property="og:image" content={finalOgImage} />
            <meta property="og:type" content="website" />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={finalDesc} />
            <meta name="twitter:image" content={finalOgImage} />

            {/* Canonical URL */}
            {canonical && <link rel="canonical" href={canonical} />}

            {/* Viewport */}
            <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
    );
}
