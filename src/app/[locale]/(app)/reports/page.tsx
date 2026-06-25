import { getTranslations, setRequestLocale } from 'next-intl/server';
import { portfolioReport } from '@/lib/actions/reports';
import { ReportCards } from '@/components/reports/report-cards';

export default async function ReportsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('reports');
  const report = await portfolioReport();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
      <ReportCards report={report} />
    </div>
  );
}
