import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SteamSearch',
  description: 'Поиск игр Steam по названию и описанию'
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
