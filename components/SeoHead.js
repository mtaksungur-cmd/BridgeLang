import Head from 'next/head';

export default function SeoHead({
    title = 'BridgeLang - Connect with Teachers Worldwide',
    description = 'Find and connect with qualified teachers for personalized online learning. Book lessons, chat with teachers, and improve your skills with BridgeLang.',
    ogImage = '/images/og-image.png',
    canonical,
    keywords = 'online tutoring, language teachers, online learning, private lessons'
}) {
    const fullTitle = title.includes('BridgeLang') ? title : `${title} | BridgeLang`;

    return (
        <Head>
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />

            {/* Open Graph */}
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={ogImage} />
            <meta property="og:type" content="website" />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={ogImage} />

            {/* Canonical URL */}
            {canonical && <link rel="canonical" href={canonical} />}

            {/* Viewport */}
            <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
    );
}
