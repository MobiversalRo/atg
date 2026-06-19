import { setRequestLocale } from 'next-intl/server';
import { getDossier } from '@/lib/actions/dossiers';
import { listDocumentTypes } from '@/lib/actions/documents';
import { DossierDetail } from '@/components/dossiers/dossier-detail';

export default async function DossierDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const [{ dossier, parcels, documents }, documentTypes] = await Promise.all([
    getDossier(id),
    listDocumentTypes(),
  ]);
  if (!dossier) return <p className="p-6 text-sm text-red-600">Not found</p>;
  return (
    <DossierDetail
      dossier={dossier}
      parcels={parcels}
      documents={documents}
      documentTypes={documentTypes}
    />
  );
}
