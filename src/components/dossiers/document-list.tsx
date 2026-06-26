'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import type { Document } from '@/lib/documents/schema';
import { formatDate } from '@/lib/domain/date';
import { DocumentEditDialog } from './document-edit-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function DocumentList({
  documents,
  documentTypes,
  canEdit,
}: {
  documents: Document[];
  documentTypes: { id: string; name: string }[];
  canEdit: boolean;
}) {
  const t = useTranslations('documents');
  const typeNames = React.useMemo(
    () => Object.fromEntries(documentTypes.map((x) => [x.id, x.name])),
    [documentTypes],
  );
  const [selected, setSelected] = React.useState<Document | null>(null);

  return (
    <>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('file')}</TableHead>
              <TableHead>{t('number')}</TableHead>
              <TableHead>{t('type')}</TableHead>
              <TableHead>{t('variant')}</TableHead>
              <TableHead>{t('date')}</TableHead>
              <TableHead>{t('uploadDate')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length ? (
              documents.map((d) => (
                <TableRow key={d.id} className="cursor-pointer" onClick={() => setSelected(d)}>
                  <TableCell className="max-w-[16rem] truncate font-medium">{d.original_filename}</TableCell>
                  <TableCell>{d.document_number ?? '—'}</TableCell>
                  <TableCell>{d.document_type_id ? (typeNames[d.document_type_id] ?? '—') : '—'}</TableCell>
                  <TableCell>{d.variant ? t(`variant_${d.variant}`) : '—'}</TableCell>
                  <TableCell>{formatDate(d.document_date) || '—'}</TableCell>
                  <TableCell>{formatDate(d.created_at) || '—'}</TableCell>
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
      <DocumentEditDialog
        doc={selected}
        documentTypes={documentTypes}
        canEdit={canEdit}
        onOpenChange={(o) => !o && setSelected(null)}
      />
    </>
  );
}
