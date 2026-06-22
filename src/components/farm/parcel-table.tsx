'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowDownUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { useSession } from '@/components/auth/session-provider';
import { can } from '@/lib/auth/rbac';
import { sqmToHa } from '@/lib/domain/area';
import { INTABULARE_STATUSES, type Crop } from '@/lib/farm/schema';
import { deleteParcel, type ParcelRow } from '@/lib/actions/parcels';
import { ParcelForm } from './parcel-form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export function ParcelTable({
  data,
  crops,
  properties,
}: {
  data: ParcelRow[];
  crops: Crop[];
  properties: { id: string; name: string }[];
}) {
  const t = useTranslations('farm');
  const tc = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const { role } = useSession();
  const canWrite = can(role, 'parcels', 'update');
  const canDelete = can(role, 'parcels', 'delete');

  const [uatFilter, setUatFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [sortByArea, setSortByArea] = React.useState(false);
  const [groupByUat, setGroupByUat] = React.useState(false);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ParcelRow | null>(null);
  const [deleting, setDeleting] = React.useState<ParcelRow | null>(null);

  const nf = React.useMemo(
    () => new Intl.NumberFormat(locale === 'ro' ? 'ro-RO' : 'en-US'),
    [locale],
  );

  const uats = React.useMemo(
    () => [...new Set(data.map((p) => p.uat).filter((u): u is string => !!u))].sort(),
    [data],
  );

  const rows = React.useMemo(() => {
    let r = data.filter(
      (p) =>
        (!uatFilter || p.uat === uatFilter) &&
        (!statusFilter || p.intabulare_status === statusFilter),
    );
    if (sortByArea) r = [...r].sort((a, b) => b.area_sqm - a.area_sqm);
    else if (groupByUat) r = [...r].sort((a, b) => (a.uat ?? '').localeCompare(b.uat ?? ''));
    return r;
  }, [data, uatFilter, statusFilter, sortByArea, groupByUat]);

  const totalHa = sqmToHa(rows.reduce((s, p) => s + p.area_sqm, 0));

  const groups = React.useMemo(() => {
    if (!groupByUat) return null;
    const m = new Map<string, ParcelRow[]>();
    for (const p of rows) {
      const k = p.uat ?? '—';
      const arr = m.get(k) ?? [];
      arr.push(p);
      m.set(k, arr);
    }
    return [...m.entries()];
  }, [rows, groupByUat]);

  async function confirmDelete() {
    if (!deleting) return;
    const res = await deleteParcel(deleting.id);
    setDeleting(null);
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    toast.success(tc('deleted'));
    router.refresh();
  }

  const showActions = canWrite || canDelete;
  const colCount = 6 + (showActions ? 1 : 0);

  function renderRow(p: ParcelRow) {
    return (
      <TableRow key={p.id}>
        <TableCell className="font-medium">{p.cf_current ?? '—'}</TableCell>
        <TableCell>{p.topo_code}</TableCell>
        <TableCell>{p.uat ?? '—'}</TableCell>
        <TableCell>{p.intabulare_status ? t(`istatus_${p.intabulare_status}`) : '—'}</TableCell>
        <TableCell>
          {nf.format(sqmToHa(p.area_sqm))} {t('haShort')}
        </TableCell>
        <TableCell>{p.crop_name ?? '—'}</TableCell>
        {showActions ? (
          <TableCell>
            <div className="flex justify-end gap-1">
              {canWrite ? (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={tc('edit')}
                  onClick={() => {
                    setEditing(p);
                    setFormOpen(true);
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
              ) : null}
              {canDelete ? (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={tc('delete')}
                  onClick={() => setDeleting(p)}
                >
                  <Trash2 className="size-4" />
                </Button>
              ) : null}
            </div>
          </TableCell>
        ) : null}
      </TableRow>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <NativeSelect
          aria-label={t('uat')}
          value={uatFilter}
          onChange={(e) => setUatFilter(e.target.value)}
        >
          <option value="">{`${t('uat')}: ${tc('all')}`}</option>
          {uats.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label={t('status')}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">{`${t('status')}: ${tc('all')}`}</option>
          {INTABULARE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`istatus_${s}`)}
            </option>
          ))}
        </NativeSelect>
        <Button
          variant={sortByArea ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setSortByArea((v) => !v);
            setGroupByUat(false);
          }}
        >
          <ArrowDownUp className="size-4" />
          {t('sortByArea')}
        </Button>
        <Button
          variant={groupByUat ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setGroupByUat((v) => !v);
            setSortByArea(false);
          }}
        >
          {t('groupByUat')}
        </Button>
        <span className="ml-auto text-sm text-muted-foreground">
          {t('total')}:{' '}
          <span className="font-medium text-foreground">
            {nf.format(totalHa)} {t('haShort')}
          </span>
        </span>
        {canWrite ? (
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            {t('addParcel')}
          </Button>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('cf')}</TableHead>
              <TableHead>{t('topoCode')}</TableHead>
              <TableHead>{t('uat')}</TableHead>
              <TableHead>{t('status')}</TableHead>
              <TableHead>{t('areaHa')}</TableHead>
              <TableHead>{t('currentCrop')}</TableHead>
              {showActions ? <TableHead /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} className="h-24 text-center text-muted-foreground">
                  {tc('noData')}
                </TableCell>
              </TableRow>
            ) : groups ? (
              groups.map(([uat, gr]) => (
                <React.Fragment key={uat}>
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={colCount} className="font-medium">
                      {uat} · {nf.format(sqmToHa(gr.reduce((s, p) => s + p.area_sqm, 0)))} {t('haShort')}
                    </TableCell>
                  </TableRow>
                  {gr.map(renderRow)}
                </React.Fragment>
              ))
            ) : (
              rows.map(renderRow)
            )}
          </TableBody>
        </Table>
      </div>

      <ParcelForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        crops={crops}
        properties={properties}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t('deleteParcelConfirm')}
        description={deleting?.topo_code}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
