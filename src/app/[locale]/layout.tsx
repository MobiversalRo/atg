import type { Metadata } from 'next';
import { Roboto, Roboto_Mono } from 'next/font/google';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Toaster } from '@/components/ui/sonner';
import '../globals.css';

// `latin-ext` covers the Romanian diacritics (ă â î ș ț).
const roboto = Roboto({
  variable: '--font-sans',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
});
const robotoMono = Roboto_Mono({
  variable: '--font-mono',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ERP Hibrid ATG',
  description: 'Management imobiliar și agribusiness',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${roboto.variable} ${robotoMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
