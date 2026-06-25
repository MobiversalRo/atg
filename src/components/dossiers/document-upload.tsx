'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { uploadDocument } from '@/lib/actions/documents';
import { DOCUMENT_VARIANTS } from '@/lib/documents/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';

export function DocumentUpload({
  dossierId,
  types,
}: {
  dossierId: string;
  types: { id: string; name: string }[];
}) {
  const t = useTranslations('documents');
  const tc = useTranslations('common');
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [busy, setBusy] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set('dossier_id', dossierId);
    const file = fd.get('file');
    if (!(file instanceof File) || file.size === 0) {
      toast.error(t('file'));
      return;
    }
    setBusy(true);
    const res = await uploadDocument(fd);
    setBusy(false);
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    toast.success(tc('saved'));
    formRef.current?.reset();
    router.refresh();
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-3 rounded-md border p-4">
      <p className="text-sm font-medium">{t('upload')}</p>
      <div className="grid gap-1.5">
        <Label>{t('file')}</Label>
        <Input type="file" name="file" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label>{t('type')}</Label>
          <NativeSelect name="document_type_id">
            <option value="">—</option>
            {types.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-1.5">
          <Label>{t('variant')}</Label>
          <NativeSelect name="variant">
            <option value="">—</option>
            {DOCUMENT_VARIANTS.map((v) => (
              <option key={v} value={v}>
                {t(`variant_${v}`)}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-1.5">
          <Label>{t('number')}</Label>
          <Input name="document_number" />
        </div>
        <div className="grid gap-1.5">
          <Label>{t('date')}</Label>
          <Input type="date" name="document_date" />
        </div>
      </div>
      <Button type="submit" disabled={busy}>
        {busy ? tc('loading') : t('upload')}
      </Button>
    </form>
  );
}
