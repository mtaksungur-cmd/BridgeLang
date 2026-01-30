import Head from 'next/head';
import { useRouter } from 'next/router';
import seoConfig from '../seo-config.json';

export default function SeoHead({ title, description, overridePath }) {
    const router = useRouter();
    const path = overridePath || router.pathname;
    const config = seoConfig[path] || {};

    const finalTitle = title || config.title || "BridgeLang | Learn English in the UK";
    const finalDesc = description || config.description || "Join BridgeLang to find verified English tutors and build confidence for life in the UK.";

    return (
        <Head>
            <title>{finalTitle}</title>
            <meta name="description" content={finalDesc} />
            <meta property="og:title" content={finalTitle} />
            <meta property="og:description" content={finalDesc} />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link rel="icon" href="/favicon.ico" />
        </Head>
    );
}
