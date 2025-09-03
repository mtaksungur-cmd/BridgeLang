import { Geist, Geist_Mono } from "next/font/google";
import "../../styles/globals.scss";                    // senin global SCSS'in
import DefaultNavbar from "../../components/DefaultNavbar";
import Footer from "../../components/Footer";
import BootstrapClient from "./BootstrapClient";
import 'bootstrap-icons/font/bootstrap-icons.css';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'BridgeLang',
  description: 'Learn English with verified tutors',
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased app-body`}>
        {/* 👇 Bootstrap JS (bundle) client-side yüklenir */}
        <BootstrapClient />

        <DefaultNavbar />
        <main>{children}</main>
        <Footer/>
      </body>
    </html>
  );
}
