'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { Dossier } from '@/lib/dossiers/schema';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function DossierTable({ rows }: { rows: Dossier[] }) {
  const t = useTranslations('dossiers');
  const tc = useTranslations('common');
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('number')}</TableHead>
            <TableHead>{t('holder')}</TableHead>
            <TableHead>{t('acquisitionDate')}</TableHead>
            <TableHead>{t('status')}</TableHead>
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
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                {tc('noData')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
