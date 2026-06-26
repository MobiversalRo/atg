'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { createDocumentType } from '@/lib/actions/documents';
import { NativeSelect } from '@/components/ui/native-select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const NEW_VALUE = '__new__';

export function DocumentTypeSelect({
  name,
  value,
  onChange,
  initialTypes,
  disabled,
}: {
  name?: string;
  value?: string;
  onChange?: (id: string) => void;
  initialTypes: { id: string; name: string }[];
  disabled?: boolean;
}) {
  const t = useTranslations('documents');
  const tc = useTranslations('common');
  const [types, setTypes] = React.useState(initialTypes);
  // Internal selection only backs the uncontrolled (form-field) case; when a
  // `value` prop is supplied the parent owns the selection.
  const [internal, setInternal] = React.useState(value ?? '');
  const selected = value !== undefined ? value : internal;
  const [adding, setAdding] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  function handleSelect(v: string) {
    if (v === NEW_VALUE) {
      setAdding(true);
      return;
    }
    setInternal(v);
    onChange?.(v);
  }

  async function addType() {
    const n = newName.trim();
    if (!n) return;
    setBusy(true);
    const res = await createDocumentType(n);
    setBusy(false);
    if (res.error || !res.id) {
      toast.error(res.error ?? 'Error');
      return;
    }
    setTypes((prev) => [...prev, { id: res.id as string, name: n }]);
    setInternal(res.id);
    onChange?.(res.id);
    setAdding(false);
    setNewName('');
  }

  return (
    <>
      <NativeSelect name={name} value={selected} disabled={disabled} onChange={(e) => handleSelect(e.target.value)}>
        <option value="">—</option>
        {types.map((x) => (
          <option key={x.id} value={x.id}>
            {x.name}
          </option>
        ))}
        {!disabled ? <option value={NEW_VALUE}>{t('addType')}</option> : null}
      </NativeSelect>
      {adding && !disabled ? (
        <div className="mt-1.5 flex items-end gap-2">
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t('newTypeName')} />
          <Button type="button" size="sm" onClick={addType} disabled={busy || !newName.trim()}>
            {tc('add')}
          </Button>
        </div>
      ) : null}
    </>
  );
}
