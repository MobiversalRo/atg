'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { createDossier } from '@/lib/actions/dossiers';
import { dossierSchema, INTABULARE_STATUSES } from '@/lib/dossiers/schema';
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
  dossier_number: string;
  original_holder: string;
  acquisition_date: string;
  intabulare_status: string;
};

const blank: FormValues = {
  dossier_number: '',
  original_holder: '',
  acquisition_date: '',
  intabulare_status: '',
};

export function DossierForm({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('dossiers');
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
    const parsed = dossierSchema.safeParse(values);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? tc('invalid'));
      return;
    }
    const res = await createDossier(parsed.data);
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
          <SheetTitle>{t('addDossier')}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
          <div className="grid gap-1.5">
            <Label htmlFor="dossier-number">{t('number')}</Label>
            <Input id="dossier-number" {...register('dossier_number', { required: true })} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="dossier-holder">{t('holder')}</Label>
            <Input id="dossier-holder" {...register('original_holder')} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="dossier-date">{t('acquisitionDate')}</Label>
            <Input id="dossier-date" type="date" {...register('acquisition_date')} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="dossier-status">{t('status')}</Label>
            <NativeSelect id="dossier-status" {...register('intabulare_status')}>
              <option value="">—</option>
              {INTABULARE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`status_${s}`)}
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
