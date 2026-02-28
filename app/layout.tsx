import type { Metadata } from 'next';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sameaitest.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'SteamSearch',
  description: 'Поиск игр Steam по названию и описанию',
  openGraph: {
    title: 'SteamSearch',
    description: 'Поиск игр Steam по названию и описанию',
    url: siteUrl,
    siteName: 'SteamSearch',
    type: 'website'
  },
  alternates: {
    canonical: '/'
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
