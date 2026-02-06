// pages/_app.js
import '../styles/globals.scss';
import { useEffect } from 'react';
import NavbarSwitcher from '../components/NavbarSwitcher';
import Footer from '../components/Footer';
import CookieBanner from '../components/CookieBanner';
import ErrorBoundary from '../components/ErrorBoundary';
import { useOnlineStatus } from '../lib/useOnlineStatus';
import { Toaster } from 'react-hot-toast';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function MyApp({ Component, pageProps }) {
  // Track online status for all authenticated users
  useOnlineStatus();

  useEffect(() => {
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  return (
    <ErrorBoundary>
      <Toaster />
      <NavbarSwitcher />
      <CookieBanner />
      <Component {...pageProps} />
      <Footer />
    </ErrorBoundary>
  );
}
