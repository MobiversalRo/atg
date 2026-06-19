import { setRequestLocale } from 'next-intl/server';
import { listDossiers } from '@/lib/actions/dossiers';
import { DossierTable } from '@/components/dossiers/dossier-table';

export default async function DossiersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { data, error } = await listDossiers();
  if (error) return <p className="p-6 text-sm text-red-600">{error}</p>;
  return <DossierTable rows={data} />;
}
