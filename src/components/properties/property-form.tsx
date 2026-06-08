'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import {
  propertySchema,
  type Property,
  PROPERTY_TYPES,
  PROPERTY_STATUSES,
  CURRENCIES,
  AREA_UNITS,
} from '@/lib/properties/schema';
import { createProperty, updateProperty } from '@/lib/actions/properties';
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
  name: string;
  type: (typeof PROPERTY_TYPES)[number];
  area_value: string;
  area_unit: (typeof AREA_UNITS)[number];
  status: (typeof PROPERTY_STATUSES)[number];
  accounting_value: string;
  currency: (typeof CURRENCIES)[number];
  energy_class: string;
  year_built: string;
  thermal_insulation: boolean;
};

const blank: FormValues = {
  name: '',
  type: 'residential',
  area_value: '0',
  area_unit: 'sqm',
  status: 'vacant',
  accounting_value: '0',
  currency: 'RON',
  energy_class: '',
  year_built: '',
  thermal_insulation: false,
};

function fromRow(p: Property): FormValues {
  return {
    name: p.name,
    type: p.type,
    area_value: String(p.area_value),
    area_unit: p.area_unit,
    status: p.status,
    accounting_value: String(p.accounting_value),
    currency: p.currency,
    energy_class: p.energy_class ?? '',
    year_built: p.year_built?.toString() ?? '',
    thermal_insulation: p.thermal_insulation ?? false,
  };
}

export function PropertyForm({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Property | null;
}) {
  const t = useTranslations('properties');
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
    const parsed = propertySchema.safeParse(values);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? tc('invalid'));
      return;
    }
    const res = editing
      ? await updateProperty(editing.id, parsed.data)
      : await createProperty(parsed.data);
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
          <SheetTitle>{editing ? t('edit') : t('add')}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
          <Field label={t('name')}>
            <Input {...register('name', { required: true })} />
          </Field>
          <Field label={t('type')}>
            <NativeSelect {...register('type')}>
              {PROPERTY_TYPES.map((v) => (
                <option key={v} value={v}>
                  {t(`type_${v}`)}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('area')}>
              <Input type="number" step="any" {...register('area_value')} />
            </Field>
            <Field label={t('areaUnit')}>
              <NativeSelect {...register('area_unit')}>
                {AREA_UNITS.map((v) => (
                  <option key={v} value={v}>
                    {t(`unit_${v}`)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          <Field label={t('status')}>
            <NativeSelect {...register('status')}>
              {PROPERTY_STATUSES.map((v) => (
                <option key={v} value={v}>
                  {t(`status_${v}`)}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('accountingValue')}>
              <Input type="number" step="any" {...register('accounting_value')} />
            </Field>
            <Field label={t('currency')}>
              <NativeSelect {...register('currency')}>
                {CURRENCIES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('energyClass')}>
              <Input {...register('energy_class')} />
            </Field>
            <Field label={t('yearBuilt')}>
              <Input type="number" {...register('year_built')} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4" {...register('thermal_insulation')} />
            {t('thermalInsulation')}
          </label>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
