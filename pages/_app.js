// pages/_app.js
import '../styles/globals.scss';
import { useEffect } from 'react';
import NavbarSwitcher from '../components/NavbarSwitcher';
import Footer from '../components/Footer';
import CookieBanner from '../components/CookieBanner';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function MyApp({ Component, pageProps }) {
  useEffect(() => {
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  return (
    <>
      <NavbarSwitcher />
      <CookieBanner />
      <Component {...pageProps} />
      <Footer />
    </>
  );
}
