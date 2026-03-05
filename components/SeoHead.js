import Head from 'next/head';
import useSeoData from '../lib/useSeoData';

export default function SeoHead({
    title = 'BridgeLang - Connect with Teachers Worldwide',
    description = 'Find and connect with qualified teachers for personalized online learning. Book lessons, chat with teachers, and improve your skills with BridgeLang.',
    ogImage = '/images/og-image.png',
    canonical,
    keywords = 'online tutoring, language teachers, online learning, private lessons'
}) {
    const seoOverride = useSeoData();

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
