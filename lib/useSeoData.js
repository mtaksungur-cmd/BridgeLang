import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

// Shared cache across all components using this hook
let firestoreSeoCache = null;
let firestoreSeoLoaded = false;
let firestoreSeoPromise = null;

export default function useSeoData() {
    const router = useRouter();
    const [seoOverride, setSeoOverride] = useState(null);

    useEffect(() => {
        const loadSeo = async () => {
            if (firestoreSeoLoaded) {
                if (firestoreSeoCache?.[router.pathname]) {
                    setSeoOverride(firestoreSeoCache[router.pathname]);
                }
                return;
            }

            // Prevent duplicate fetches
            if (!firestoreSeoPromise) {
                firestoreSeoPromise = (async () => {
                    try {
                        const { doc, getDoc } = await import('firebase/firestore');
                        const { db } = await import('./firebase');
                        const snap = await getDoc(doc(db, 'settings', 'seo'));
                        if (snap.exists()) {
                            firestoreSeoCache = snap.data().pages || {};
                        }
                    } catch {
                        // Firestore not available, use defaults
                    }
                    firestoreSeoLoaded = true;
                })();
            }

            await firestoreSeoPromise;

            if (firestoreSeoCache?.[router.pathname]) {
                setSeoOverride(firestoreSeoCache[router.pathname]);
            }
        };

        loadSeo();
    }, [router.pathname]);

    return {
        h1: seoOverride?.h1 || null,
        h2: seoOverride?.h2 || null,
        title: seoOverride?.title || null,
        description: seoOverride?.description || null,
        keywords: seoOverride?.keywords || null,
        ogImage: seoOverride?.ogImage || null,
    };
}
