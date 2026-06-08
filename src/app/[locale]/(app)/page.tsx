import { getTranslations } from 'next-intl/server';

export default async function DashboardPage() {
  const t = await getTranslations();
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{t('nav.dashboard')}</h1>
      <p className="mt-2 text-muted-foreground">{t('pages.comingSoon')}</p>
    </div>
  );
}
