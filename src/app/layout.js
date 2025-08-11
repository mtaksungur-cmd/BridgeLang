import { Geist, Geist_Mono } from "next/font/google";
import '../../styles/globals.scss';
import DefaultNavbar from '../../components/DefaultNavbar';

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

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <DefaultNavbar/>
        <main>{children}</main>
      </body>
    </html>
  );
}
