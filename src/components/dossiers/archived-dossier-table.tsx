'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { ArchiveRestore } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useRouter } from '@/i18n/navigation';
import { unarchiveDossier } from '@/lib/actions/dossiers';
import type { Dossier } from '@/lib/dossiers/schema';
import { formatDate } from '@/lib/domain/date';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export function ArchivedDossierTable({ rows }: { rows: Dossier[] }) {
  const t = useTranslations('dossiers');
  const tc = useTranslations('common');
  const router = useRouter();
  const [restoring, setRestoring] = React.useState<string | null>(null);

  async function restore(id: string) {
    setRestoring(id);
    const res = await unarchiveDossier(id);
    setRestoring(null);
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    toast.success(tc('saved'));
    router.refresh();
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('number')}</TableHead>
            <TableHead>{t('holder')}</TableHead>
            <TableHead>{t('acquisitionDate')}</TableHead>
            <TableHead>{t('status')}</TableHead>
            <TableHead />
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
                <TableCell>{formatDate(d.acquisition_date) || '—'}</TableCell>
                <TableCell>
                  {d.intabulare_status ? t(`status_${d.intabulare_status}`) : '—'}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={restoring === d.id}
                      onClick={() => restore(d.id)}
                    >
                      <ArchiveRestore className="size-4" />
                      {t('restore')}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                {t('noArchived')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
