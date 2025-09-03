import Head from 'next/head';
import CookiePreferences from '../components/CookiePreferences';

export default function CookiePreferencesPage() {
  return (
    <>
      <Head>
        <title>Cookie Preferences | BridgeLang</title>
        <meta name="robots" content="noindex,follow" />
      </Head>
      <CookiePreferences />
    </>
  );
}
