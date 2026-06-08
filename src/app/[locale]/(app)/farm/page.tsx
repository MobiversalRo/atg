import { getTranslations } from 'next-intl/server';

export default async function FarmPage() {
  const t = await getTranslations();
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{t('nav.farm')}</h1>
      <p className="mt-2 text-muted-foreground">{t('pages.comingSoon')}</p>
    </div>
  );
}
