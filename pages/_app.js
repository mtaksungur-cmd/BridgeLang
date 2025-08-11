import React, { useEffect } from 'react';
import '../styles/globals.scss';
import { useRouter } from 'next/router';
import DefaultNavbar from '../components/DefaultNavbar';

export default function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  // Auth alanları: kendi layout'ları navbar'ı getiriyor (student/teacher)
  const isAuthArea =
    router.pathname.startsWith('/student') || router.pathname.startsWith('/teacher');

  return (
    <>
      {!isAuthArea && <DefaultNavbar />}
      <Component {...pageProps} />
    </>
  );
}