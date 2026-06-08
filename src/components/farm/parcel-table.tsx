'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { useSession } from '@/components/auth/session-provider';
import { can } from '@/lib/auth/rbac';
import type { Crop } from '@/lib/farm/schema';
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

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ParcelRow | null>(null);
  const [deleting, setDeleting] = React.useState<ParcelRow | null>(null);
  const nf = React.useMemo(
    () => new Intl.NumberFormat(locale === 'ro' ? 'ro-RO' : 'en-US'),
    [locale],
  );

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

  const cols = 3 + (canWrite || canDelete ? 1 : 0);

  return (
    <div className="flex flex-col gap-4">
      {canWrite ? (
        <div className="flex justify-end">
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
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('topoCode')}</TableHead>
              <TableHead>{t('areaHa')}</TableHead>
              <TableHead>{t('currentCrop')}</TableHead>
              {canWrite || canDelete ? <TableHead /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length ? (
              data.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.topo_code}</TableCell>
                  <TableCell>
                    {nf.format(Number(p.area_ha))} {t('haShort')}
                  </TableCell>
                  <TableCell>{p.crop_name ?? '—'}</TableCell>
                  {canWrite || canDelete ? (
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
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={cols} className="h-24 text-center text-muted-foreground">
                  {tc('noData')}
                </TableCell>
              </TableRow>
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
