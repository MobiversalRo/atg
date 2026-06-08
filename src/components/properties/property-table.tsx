'use client';

import * as React from 'react';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Download, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { useSession } from '@/components/auth/session-provider';
import { can } from '@/lib/auth/rbac';
import { type Property, PROPERTY_STATUSES, PROPERTY_TYPES } from '@/lib/properties/schema';
import { deleteProperty } from '@/lib/actions/properties';
import { portfolioByCurrency } from '@/lib/domain/portfolio';
import { toCsv } from '@/lib/csv';
import { PropertyForm } from './property-form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { NativeSelect } from '@/components/ui/native-select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function PropertyTable({ data }: { data: Property[] }) {
  const t = useTranslations('properties');
  const tc = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const { role } = useSession();

  const canCreate = can(role, 'properties', 'create');
  const canUpdate = can(role, 'properties', 'update');
  const canDelete = can(role, 'properties', 'delete');

  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Property | null>(null);
  const [deleting, setDeleting] = React.useState<Property | null>(null);

  const nf = React.useMemo(
    () => new Intl.NumberFormat(locale === 'ro' ? 'ro-RO' : 'en-US'),
    [locale],
  );

  const filtered = React.useMemo(
    () =>
      data.filter(
        (p) =>
          (!typeFilter || p.type === typeFilter) &&
          (!statusFilter || p.status === statusFilter) &&
          (!search || p.name.toLowerCase().includes(search.toLowerCase())),
      ),
    [data, typeFilter, statusFilter, search],
  );

  const portfolio = React.useMemo(
    () =>
      portfolioByCurrency(
        data.map((p) => ({ accounting_value: Number(p.accounting_value), currency: p.currency })),
      ),
    [data],
  );

  const columns = React.useMemo<ColumnDef<Property>[]>(() => {
    const base: ColumnDef<Property>[] = [
      { accessorKey: 'name', header: t('name') },
      {
        accessorKey: 'type',
        header: t('type'),
        cell: ({ row }) => <Badge variant="secondary">{t(`type_${row.original.type}`)}</Badge>,
      },
      {
        accessorKey: 'area_value',
        header: t('area'),
        cell: ({ row }) =>
          `${nf.format(Number(row.original.area_value))} ${t(`unit_${row.original.area_unit}`)}`,
      },
      {
        accessorKey: 'status',
        header: t('status'),
        cell: ({ row }) => t(`status_${row.original.status}`),
      },
      {
        accessorKey: 'accounting_value',
        header: t('accountingValue'),
        cell: ({ row }) =>
          `${nf.format(Number(row.original.accounting_value))} ${row.original.currency}`,
      },
    ];
    if (canUpdate || canDelete) {
      base.push({
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            {canUpdate && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={tc('edit')}
                onClick={() => {
                  setEditing(row.original);
                  setFormOpen(true);
                }}
              >
                <Pencil className="size-4" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={tc('delete')}
                onClick={() => setDeleting(row.original)}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        ),
      });
    }
    return base;
  }, [t, tc, nf, canUpdate, canDelete]);

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  function exportCsv() {
    const rows = filtered.map((p) => ({
      name: p.name,
      type: t(`type_${p.type}`),
      area: `${p.area_value} ${t(`unit_${p.area_unit}`)}`,
      status: t(`status_${p.status}`),
      value: p.accounting_value,
      currency: p.currency,
    }));
    const csv = toCsv(rows, ['name', 'type', 'area', 'status', 'value', 'currency']);
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'properties.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function confirmDelete() {
    if (!deleting) return;
    const res = await deleteProperty(deleting.id);
    setDeleting(null);
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    toast.success(tc('deleted'));
    router.refresh();
  }

  const portfolioText =
    Object.entries(portfolio)
      .map(([currency, value]) => `${nf.format(value)} ${currency}`)
      .join(' · ') || '—';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('portfolioTotal')}: <span className="font-medium text-foreground">{portfolioText}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="size-4" />
            {tc('export')}
          </Button>
          {canCreate && (
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="size-4" />
              {t('add')}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder={tc('search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <NativeSelect
          aria-label={t('type')}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">{`${t('type')}: ${tc('all')}`}</option>
          {PROPERTY_TYPES.map((v) => (
            <option key={v} value={v}>
              {t(`type_${v}`)}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label={t('status')}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">{`${t('status')}: ${tc('all')}`}</option>
          {PROPERTY_STATUSES.map((v) => (
            <option key={v} value={v}>
              {t(`status_${v}`)}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder
                      ? null
                      : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((r) => (
                <TableRow key={r.id}>
                  {r.getVisibleCells().map((c) => (
                    <TableCell key={c.id}>
                      {flexRender(c.column.columnDef.cell, c.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {tc('noData')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-sm text-muted-foreground">
          {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <PropertyForm open={formOpen} onOpenChange={setFormOpen} editing={editing} />

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteConfirm')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{deleting?.name}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              {tc('cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {tc('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
