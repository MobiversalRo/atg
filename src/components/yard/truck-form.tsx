'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import type { Crop } from '@/lib/farm/schema';
import { truckSchema, YARD_DIRECTIONS } from '@/lib/yard/schema';
import { createTruck, updateTruck, type TruckRow } from '@/lib/actions/yard';
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
  plate_number: string;
  driver: string;
  cargo_crop_id: string;
  direction: (typeof YARD_DIRECTIONS)[number];
};

const blank: FormValues = {
  plate_number: '',
  driver: '',
  cargo_crop_id: '',
  direction: 'inbound',
};

function fromRow(t: TruckRow): FormValues {
  return {
    plate_number: t.plate_number,
    driver: t.driver ?? '',
    cargo_crop_id: t.cargo_crop_id ?? '',
    direction: t.direction,
  };
}

export function TruckForm({
  open,
  onOpenChange,
  editing,
  crops,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: TruckRow | null;
  crops: Crop[];
}) {
  const t = useTranslations('yard');
  const tc = useTranslations('common');
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({ defaultValues: blank });

  React.useEffect(() => {
    if (open) reset(editing ? fromRow(editing) : blank);
  }, [open, editing, reset]);

  async function onSubmit(values: FormValues) {
    const parsed = truckSchema.safeParse(values);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? tc('invalid'));
      return;
    }
    const res = editing
      ? await updateTruck(editing.id, parsed.data)
      : await createTruck(parsed.data);
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    toast.success(tc('saved'));
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{editing ? t('editTruck') : t('addTruck')}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
          <div className="grid gap-1.5">
            <Label htmlFor="truck-plate">{t('plate')}</Label>
            <Input id="truck-plate" {...register('plate_number', { required: true })} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="truck-driver">{t('driver')}</Label>
            <Input id="truck-driver" {...register('driver')} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="truck-cargo">{t('cargo')}</Label>
            <NativeSelect id="truck-cargo" {...register('cargo_crop_id')}>
              <option value="">—</option>
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="truck-direction">{t('direction')}</Label>
            <NativeSelect id="truck-direction" {...register('direction')}>
              {YARD_DIRECTIONS.map((d) => (
                <option key={d} value={d}>
                  {t(`dir_${d}`)}
                </option>
              ))}
            </NativeSelect>
          </div>
          <SheetFooter className="px-0">
            <Button type="submit" disabled={isSubmitting}>
              {tc('save')}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
