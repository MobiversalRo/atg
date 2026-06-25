'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { useSession } from '@/components/auth/session-provider';
import { can } from '@/lib/auth/rbac';
import { archiveDossier } from '@/lib/actions/dossiers';
import type { Dossier } from '@/lib/dossiers/schema';
import type { Parcel } from '@/lib/farm/schema';
import type { Document } from '@/lib/documents/schema';
import { sqmToHa } from '@/lib/domain/area';
import { DocumentList } from './document-list';
import { DocumentUpload } from './document-upload';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export function DossierDetail({
  dossier,
  parcels,
  documents,
  documentTypes,
}: {
  dossier: Dossier;
  parcels: Parcel[];
  documents: Document[];
  documentTypes: { id: string; name: string }[];
}) {
  const t = useTranslations('dossiers');
  const tc = useTranslations('common');
  const router = useRouter();
  const { role } = useSession();
  const canArchive = can(role, 'dossiers', 'delete');
  const canUpload = can(role, 'documents', 'create');
  const [confirm, setConfirm] = React.useState(false);
  const typeNames = React.useMemo(
    () => Object.fromEntries(documentTypes.map((x) => [x.id, x.name])),
    [documentTypes],
  );

  async function onArchive() {
    setConfirm(false);
    const res = await archiveDossier(dossier.id);
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    toast.success(tc('saved'));
    router.push('/dossiers');
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between rounded-md border p-4">
        <div className="grid gap-1 text-sm">
          <h1 className="text-lg font-semibold">
            {t('number')}: {dossier.dossier_number}
          </h1>
          <p>
            {t('holder')}: {dossier.original_holder ?? '—'}
          </p>
          <p>
            {t('acquisitionDate')}: {dossier.acquisition_date ?? '—'}
          </p>
          <p>
            {t('status')}: {dossier.intabulare_status ? t(`status_${dossier.intabulare_status}`) : '—'}
          </p>
        </div>
        {canArchive ? (
          <Button variant="outline" size="sm" onClick={() => setConfirm(true)}>
            {t('archive')}
          </Button>
        ) : null}
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">{t('parcels')}</h2>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <tbody>
              {parcels.length ? (
                parcels.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="p-2 font-medium">{p.cf_current ?? p.topo_code}</td>
                    <td className="p-2">{p.uat ?? '—'}</td>
                    <td className="p-2">{sqmToHa(p.area_sqm).toFixed(2)} ha</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-2 text-muted-foreground">{tc('noData')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">{t('documents')}</h2>
        <DocumentList documents={documents} typeNames={typeNames} />
        {canUpload ? <DocumentUpload dossierId={dossier.id} types={documentTypes} /> : null}
      </section>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={t('archiveConfirm')}
        description={dossier.dossier_number}
        onConfirm={onArchive}
      />
    </div>
  );
}
