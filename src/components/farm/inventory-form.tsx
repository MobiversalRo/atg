'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { stockTxnSchema, TXN_TYPES, type Crop } from '@/lib/farm/schema';
import { recordStockTransaction } from '@/lib/actions/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';

export function InventoryForm({
  facilities,
  crops,
}: {
  facilities: { id: string; name: string }[];
  crops: Crop[];
}) {
  const t = useTranslations('farm');
  const tc = useTranslations('common');
  const router = useRouter();

  const [facility, setFacility] = React.useState(facilities[0]?.id ?? '');
  const [crop, setCrop] = React.useState(crops[0]?.id ?? '');
  const [type, setType] = React.useState<(typeof TXN_TYPES)[number]>('in');
  const [qty, setQty] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = stockTxnSchema.safeParse({
      facility_id: facility,
      crop_id: crop,
      txn_type: type,
      quantity_ton: qty,
    });
    if (!parsed.success) {
      toast.error(tc('invalid'));
      return;
    }
    setBusy(true);
    const res = await recordStockTransaction(parsed.data);
    setBusy(false);
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    toast.success(tc('saved'));
    setQty('');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3 rounded-md border p-3">
      <div className="grid gap-1.5">
        <Label>{t('facility')}</Label>
        <NativeSelect value={facility} onChange={(e) => setFacility(e.target.value)}>
          {facilities.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="grid gap-1.5">
        <Label>{t('crop')}</Label>
        <NativeSelect value={crop} onChange={(e) => setCrop(e.target.value)}>
          {crops.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="grid gap-1.5">
        <Label>{t('movementType')}</Label>
        <NativeSelect
          value={type}
          onChange={(e) => setType(e.target.value as (typeof TXN_TYPES)[number])}
        >
          {TXN_TYPES.map((v) => (
            <option key={v} value={v}>
              {t(`txn_${v}`)}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="grid gap-1.5">
        <Label>{t('quantity')}</Label>
        <Input
          type="number"
          step="any"
          min="0"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="w-28"
        />
      </div>
      <Button type="submit" disabled={busy || !facility || !crop}>
        {t('recordMovement')}
      </Button>
    </form>
  );
}
