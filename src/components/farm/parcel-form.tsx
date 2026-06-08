'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { parcelSchema, type Crop } from '@/lib/farm/schema';
import {
  addParcelHistory,
  createParcel,
  listParcelHistory,
  updateParcel,
  type HistoryRow,
  type ParcelRow,
} from '@/lib/actions/parcels';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';

type FormValues = {
  topo_code: string;
  area_ha: string;
  current_crop_id: string;
  property_id: string;
  notes: string;
};

const blank: FormValues = {
  topo_code: '',
  area_ha: '0',
  current_crop_id: '',
  property_id: '',
  notes: '',
};

function fromRow(p: ParcelRow): FormValues {
  return {
    topo_code: p.topo_code,
    area_ha: String(p.area_ha),
    current_crop_id: p.current_crop_id ?? '',
    property_id: p.property_id ?? '',
    notes: p.notes ?? '',
  };
}

export function ParcelForm({
  open,
  onOpenChange,
  editing,
  crops,
  properties,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: ParcelRow | null;
  crops: Crop[];
  properties: { id: string; name: string }[];
}) {
  const t = useTranslations('farm');
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{editing ? t('editParcel') : t('addParcel')}</SheetTitle>
        </SheetHeader>
        {/* Remounted per target so form + history state initialize fresh. */}
        {open ? (
          <ParcelFormBody
            key={editing?.id ?? 'new'}
            editing={editing}
            crops={crops}
            properties={properties}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function ParcelFormBody({
  editing,
  crops,
  properties,
  onDone,
}: {
  editing: ParcelRow | null;
  crops: Crop[];
  properties: { id: string; name: string }[];
  onDone: () => void;
}) {
  const t = useTranslations('farm');
  const tc = useTranslations('common');
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({ defaultValues: editing ? fromRow(editing) : blank });

  const [history, setHistory] = React.useState<HistoryRow[]>([]);
  const [season, setSeason] = React.useState('');
  const [seasonCrop, setSeasonCrop] = React.useState('');

  React.useEffect(() => {
    if (!editing) return;
    let active = true;
    listParcelHistory(editing.id).then((h) => {
      if (active) setHistory(h);
    });
    return () => {
      active = false;
    };
  }, [editing]);

  async function onSubmit(values: FormValues) {
    const parsed = parcelSchema.safeParse(values);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? tc('invalid'));
      return;
    }
    const res = editing
      ? await updateParcel(editing.id, parsed.data)
      : await createParcel(parsed.data);
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    toast.success(tc('saved'));
    onDone();
    router.refresh();
  }

  async function addSeason() {
    if (!editing || !seasonCrop || !season) return;
    const res = await addParcelHistory(editing.id, seasonCrop, Number(season));
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    setSeason('');
    setSeasonCrop('');
    const refreshed = await listParcelHistory(editing.id);
    setHistory(refreshed);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
      <div className="grid gap-1.5">
        <Label>{t('topoCode')}</Label>
        <Input {...register('topo_code', { required: true })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label>{t('areaHa')}</Label>
          <Input type="number" step="any" {...register('area_ha')} />
        </div>
        <div className="grid gap-1.5">
          <Label>{t('currentCrop')}</Label>
          <NativeSelect {...register('current_crop_id')}>
            <option value="">—</option>
            {crops.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label>{t('linkedProperty')}</Label>
        <NativeSelect {...register('property_id')}>
          <option value="">—</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="grid gap-1.5">
        <Label>{t('notes')}</Label>
        <Input {...register('notes')} />
      </div>

      {editing ? (
        <div className="rounded-md border p-3">
          <p className="mb-2 text-sm font-medium">{t('rotationHistory')}</p>
          {history.length ? (
            <ul className="mb-3 space-y-1 text-sm text-muted-foreground">
              {history.map((h) => (
                <li key={h.id}>
                  {h.season_year} — {h.crop_name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-3 text-sm text-muted-foreground">{tc('noData')}</p>
          )}
          <div className="flex items-end gap-2">
            <NativeSelect
              value={seasonCrop}
              onChange={(e) => setSeasonCrop(e.target.value)}
              className="flex-1"
            >
              <option value="">{t('currentCrop')}</option>
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
            <Input
              type="number"
              placeholder={t('season')}
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="w-24"
            />
            <Button
              type="button"
              variant="outline"
              onClick={addSeason}
              disabled={!seasonCrop || !season}
            >
              {tc('add')}
            </Button>
          </div>
        </div>
      ) : null}

      <SheetFooter className="px-0">
        <Button type="submit" disabled={isSubmitting}>
          {tc('save')}
        </Button>
      </SheetFooter>
    </form>
  );
}
