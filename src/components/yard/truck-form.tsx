'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import type { Crop } from '@/lib/farm/schema';
import { truckSchema, YARD_DIRECTIONS } from '@/lib/yard/schema';
import { createTruck } from '@/lib/actions/yard';
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

export function TruckForm({
  open,
  onOpenChange,
  crops,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
    if (open) reset(blank);
  }, [open, reset]);

  async function onSubmit(values: FormValues) {
    const parsed = truckSchema.safeParse(values);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? tc('invalid'));
      return;
    }
    const res = await createTruck(parsed.data);
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
          <SheetTitle>{t('addTruck')}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
          <div className="grid gap-1.5">
            <Label>{t('plate')}</Label>
            <Input {...register('plate_number', { required: true })} />
          </div>
          <div className="grid gap-1.5">
            <Label>{t('driver')}</Label>
            <Input {...register('driver')} />
          </div>
          <div className="grid gap-1.5">
            <Label>{t('cargo')}</Label>
            <NativeSelect {...register('cargo_crop_id')}>
              <option value="">—</option>
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="grid gap-1.5">
            <Label>{t('direction')}</Label>
            <NativeSelect {...register('direction')}>
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
