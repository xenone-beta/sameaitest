import type { Metadata } from 'next';
import './globals.css';

const defaultSiteUrl = 'https://sameaitest.vercel.app';

function resolveSiteUrl(rawUrl: string | undefined): string {
  if (!rawUrl) {
    return defaultSiteUrl;
  }

  try {
    const normalized = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
    return new URL(normalized).toString();
  } catch {
    return defaultSiteUrl;
  }
}

const siteUrl = resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

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
