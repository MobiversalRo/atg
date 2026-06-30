'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { getDocumentUrl, updateDocument } from '@/lib/actions/documents';
import { DOCUMENT_VARIANTS, type Document } from '@/lib/documents/schema';
import { DocumentTypeSelect } from './document-type-select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';

export function DocumentEditDialog({
  doc,
  documentTypes,
  canEdit,
  onOpenChange,
}: {
  doc: Document | null;
  documentTypes: { id: string; name: string }[];
  canEdit: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('documents');

  return (
    <Dialog open={!!doc} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('editTitle')}</DialogTitle>
        </DialogHeader>
        {doc ? (
          // Remount per document so each form initialises its fields straight
          // from the document props (no prop-to-state syncing effect).
          <EditForm
            key={doc.id}
            doc={doc}
            documentTypes={documentTypes}
            canEdit={canEdit}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function EditForm({
  doc,
  documentTypes,
  canEdit,
  onOpenChange,
}: {
  doc: Document;
  documentTypes: { id: string; name: string }[];
  canEdit: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('documents');
  const tc = useTranslations('common');
  const router = useRouter();
  const [typeId, setTypeId] = React.useState(doc.document_type_id ?? '');
  const [variant, setVariant] = React.useState<string>(doc.variant ?? '');
  const [docNumber, setDocNumber] = React.useState(doc.document_number ?? '');
  const [docDate, setDocDate] = React.useState(doc.document_date ?? '');
  const [busy, setBusy] = React.useState(false);

  async function view() {
    const res = await getDocumentUrl(doc.storage_path);
    if (res.error || !res.url) {
      toast.error(res.error ?? 'Error');
      return;
    }
    window.open(res.url, '_blank');
  }

  async function save() {
    setBusy(true);
    const res = await updateDocument(doc.id, {
      document_type_id: typeId || null,
      variant: variant || null,
      document_number: docNumber || null,
      document_date: docDate || null,
    });
    setBusy(false);
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    toast.success(tc('saved'));
    onOpenChange(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="truncate text-sm text-muted-foreground">{doc.original_filename}</p>
      <div className="grid grid-cols-1 gap-1.5">
        <Label>{t('type')}</Label>
        <DocumentTypeSelect
          value={typeId}
          onChange={setTypeId}
          initialTypes={documentTypes}
          disabled={!canEdit}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid grid-cols-1 gap-1.5">
          <Label htmlFor="doc-variant">{t('variant')}</Label>
          <NativeSelect
            id="doc-variant"
            value={variant}
            disabled={!canEdit}
            onChange={(e) => setVariant(e.target.value)}
          >
            <option value="">—</option>
            {DOCUMENT_VARIANTS.map((v) => (
              <option key={v} value={v}>
                {t(`variant_${v}`)}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          <Label htmlFor="doc-number">{t('number')}</Label>
          <Input id="doc-number" value={docNumber} disabled={!canEdit} onChange={(e) => setDocNumber(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          <Label htmlFor="doc-date">{t('date')}</Label>
          <Input id="doc-date" type="date" value={docDate} disabled={!canEdit} onChange={(e) => setDocDate(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={view}>
          {t('view')}
        </Button>
        {canEdit ? (
          <Button onClick={save} disabled={busy}>
            {tc('save')}
          </Button>
        ) : null}
      </DialogFooter>
    </div>
  );
}
