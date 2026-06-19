'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { Document } from '@/lib/documents/schema';
import { getDocumentUrl } from '@/lib/actions/documents';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export function DocumentList({
  documents,
  typeNames,
}: {
  documents: Document[];
  typeNames: Record<string, string>;
}) {
  const t = useTranslations('documents');

  async function view(path: string) {
    const res = await getDocumentUrl(path);
    if (res.error || !res.url) {
      toast.error(res.error ?? 'Error');
      return;
    }
    window.open(res.url, '_blank');
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('type')}</TableHead>
            <TableHead>{t('variant')}</TableHead>
            <TableHead>{t('number')}</TableHead>
            <TableHead>{t('date')}</TableHead>
            <TableHead>{t('file')}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.length ? (
            documents.map((d) => (
              <TableRow key={d.id}>
                <TableCell>
                  {d.document_type_id ? (typeNames[d.document_type_id] ?? '—') : '—'}
                </TableCell>
                <TableCell>{d.variant ? t(`variant_${d.variant}`) : '—'}</TableCell>
                <TableCell>{d.document_number ?? '—'}</TableCell>
                <TableCell>{d.document_date ?? '—'}</TableCell>
                <TableCell className="max-w-[16rem] truncate">{d.original_filename}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => view(d.storage_path)}>
                    {t('view')}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                {t('noDocuments')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
