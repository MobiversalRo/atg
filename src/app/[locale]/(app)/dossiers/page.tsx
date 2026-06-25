import { setRequestLocale } from 'next-intl/server';
import { listDossiers, listArchivedDossiers } from '@/lib/actions/dossiers';
import { DossiersView } from '@/components/dossiers/dossiers-view';

export default async function DossiersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [{ data: active, error }, { data: archived }] = await Promise.all([
    listDossiers(),
    listArchivedDossiers(),
  ]);
  if (error) return <p className="p-6 text-sm text-red-600">{error}</p>;
  return <DossiersView active={active} archived={archived} />;
}
