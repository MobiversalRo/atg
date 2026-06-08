import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('home');
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 p-8">
      <h1 className="text-2xl font-semibold">404</h1>
      <p className="text-muted-foreground">{t('title')}</p>
    </main>
  );
}
