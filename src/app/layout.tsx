import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Provider as JotaiProvider } from 'jotai';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster
import Head from 'next/head';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Scratch Tutorial Maker', // Updated title
  description: 'Generate tutorials for your Scratch projects.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Head>
        <Script src="https://cdn.jsdelivr.net/npm/parse-sb3-blocks@0.5.0/dist/parse-sb3-blocks.browser.js" strategy="lazyOnload" />
      </Head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        <JotaiProvider>
          {children}
          <Toaster /> {/* Add Toaster here */}
        </JotaiProvider>
        <script async src="https://cdn.jsdelivr.net/npm/parse-sb3-blocks@0.5.0/dist/parse-sb3-blocks.browser.js"></script>
      </body>
    </html>
  );
}
