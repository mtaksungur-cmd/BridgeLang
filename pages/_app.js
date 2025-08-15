// pages/_app.js
import '../styles/globals.scss';
import { useEffect } from 'react';
import NavbarSwitcher from '../components/NavbarSwitcher';

export default function MyApp({ Component, pageProps }) {
  useEffect(() => {
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  return (
    <>
      <NavbarSwitcher />
      <Component {...pageProps} />
    </>
  );
}
