'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Archive } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useRouter } from '@/i18n/navigation';
import { useSession } from '@/components/auth/session-provider';
import { can } from '@/lib/auth/rbac';
import type { Dossier } from '@/lib/dossiers/schema';
import { archiveDossier } from '@/lib/actions/dossiers';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export function DossierTable({ rows }: { rows: Dossier[] }) {
  const t = useTranslations('dossiers');
  const tc = useTranslations('common');
  const router = useRouter();
  const { role } = useSession();
  const canArchive = can(role, 'dossiers', 'delete');
  const [archiving, setArchiving] = React.useState<Dossier | null>(null);

  const colCount = 4 + (canArchive ? 1 : 0);

  async function confirmArchive() {
    if (!archiving) return;
    const res = await archiveDossier(archiving.id);
    setArchiving(null);
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    toast.success(tc('saved'));
    router.refresh();
  }

  return (
    <>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('number')}</TableHead>
              <TableHead>{t('holder')}</TableHead>
              <TableHead>{t('acquisitionDate')}</TableHead>
              <TableHead>{t('status')}</TableHead>
              {canArchive ? <TableHead /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">
                    <Link href={`/dossiers/${d.id}`} className="underline-offset-2 hover:underline">
                      {d.dossier_number}
                    </Link>
                  </TableCell>
                  <TableCell>{d.original_holder ?? '—'}</TableCell>
                  <TableCell>{d.acquisition_date ?? '—'}</TableCell>
                  <TableCell>
                    {d.intabulare_status ? t(`status_${d.intabulare_status}`) : '—'}
                  </TableCell>
                  {canArchive ? (
                    <TableCell>
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t('archive')}
                          onClick={() => setArchiving(d)}
                        >
                          <Archive className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={colCount} className="h-24 text-center text-muted-foreground">
                  {tc('noData')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <ConfirmDialog
        open={!!archiving}
        onOpenChange={(o) => !o && setArchiving(null)}
        title={t('archiveConfirm')}
        description={archiving?.dossier_number}
        confirmLabel={t('archive')}
        onConfirm={confirmArchive}
      />
    </>
  );
}
