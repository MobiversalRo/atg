'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { leaseSchema, PAYMENT_METHODS, PAYMENT_STATUSES } from '@/lib/farm/schema';
import { createLease, updateLease, type LeaseRow } from '@/lib/actions/leases';
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
  parcel_id: string;
  owner_name: string;
  owner_id_code: string;
  contract_number: string;
  start_date: string;
  expiry_date: string;
  payment_method: (typeof PAYMENT_METHODS)[number];
  payment_status: (typeof PAYMENT_STATUSES)[number];
  amount: string;
};

const blank: FormValues = {
  parcel_id: '',
  owner_name: '',
  owner_id_code: '',
  contract_number: '',
  start_date: '',
  expiry_date: '',
  payment_method: 'cash',
  payment_status: 'unpaid',
  amount: '',
};

function fromRow(l: LeaseRow): FormValues {
  return {
    parcel_id: l.parcel_id ?? '',
    owner_name: l.owner_name,
    owner_id_code: l.owner_id_code ?? '',
    contract_number: l.contract_number ?? '',
    start_date: l.start_date ?? '',
    expiry_date: l.expiry_date ?? '',
    payment_method: l.payment_method,
    payment_status: l.payment_status,
    amount: l.amount?.toString() ?? '',
  };
}

export function LeaseForm({
  open,
  onOpenChange,
  editing,
  parcels,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: LeaseRow | null;
  parcels: { id: string; topo_code: string }[];
}) {
  const t = useTranslations('farm');
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
    const parsed = leaseSchema.safeParse(values);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? tc('invalid'));
      return;
    }
    const res = editing
      ? await updateLease(editing.id, parsed.data)
      : await createLease(parsed.data);
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
          <SheetTitle>{editing ? t('editLease') : t('addLease')}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
          <div className="grid gap-1.5">
            <Label>{t('owner')}</Label>
            <Input {...register('owner_name', { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>{t('idCode')}</Label>
              <Input {...register('owner_id_code')} />
            </div>
            <div className="grid gap-1.5">
              <Label>{t('contract')}</Label>
              <Input {...register('contract_number')} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>{t('parcel')}</Label>
            <NativeSelect {...register('parcel_id')}>
              <option value="">—</option>
              {parcels.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.topo_code}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>{t('startDate')}</Label>
              <Input type="date" {...register('start_date')} />
            </div>
            <div className="grid gap-1.5">
              <Label>{t('expiryDate')}</Label>
              <Input type="date" {...register('expiry_date')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>{t('paymentMethod')}</Label>
              <NativeSelect {...register('payment_method')}>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {t(`method_${m}`)}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="grid gap-1.5">
              <Label>{t('paymentStatus')}</Label>
              <NativeSelect {...register('payment_status')}>
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`pstatus_${s}`)}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>{t('amount')}</Label>
            <Input type="number" step="any" {...register('amount')} />
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
