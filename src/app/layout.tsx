import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Provider as JotaiProvider } from 'jotai';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster

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
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        <JotaiProvider>
          {children}
          <Toaster /> {/* Add Toaster here */}
        </JotaiProvider>
      </body>
    </html>
  );
}
