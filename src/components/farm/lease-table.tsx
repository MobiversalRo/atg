'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { useSession } from '@/components/auth/session-provider';
import { can } from '@/lib/auth/rbac';
import { daysUntil, isExpiringSoon } from '@/lib/domain/leases';
import { formatDate } from '@/lib/domain/date';
import { deleteLease, type LeaseRow } from '@/lib/actions/leases';
import { LeaseForm } from './lease-form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';

export function LeaseTable({
  data,
  parcels,
}: {
  data: LeaseRow[];
  parcels: { id: string; topo_code: string }[];
}) {
  const t = useTranslations('farm');
  const tc = useTranslations('common');
  const router = useRouter();
  const { role } = useSession();
  const canWrite = can(role, 'leases', 'update');
  const canDelete = can(role, 'leases', 'delete');

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<LeaseRow | null>(null);
  const [deleting, setDeleting] = React.useState<LeaseRow | null>(null);

  async function confirmDelete() {
    if (!deleting) return;
    const res = await deleteLease(deleting.id);
    setDeleting(null);
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    toast.success(tc('deleted'));
    router.refresh();
  }

  const cols = 5 + (canWrite || canDelete ? 1 : 0);

  function expiryCell(l: LeaseRow) {
    if (!l.expiry_date) return <span className="text-muted-foreground">—</span>;
    const days = daysUntil(l.expiry_date);
    const soon = isExpiringSoon(l.expiry_date, 60);
    return (
      <div className="flex items-center gap-2">
        <span>{formatDate(l.expiry_date)}</span>
        {days < 0 ? (
          <Badge variant="outline">{t('expired')}</Badge>
        ) : soon ? (
          <Badge variant="destructive">{t('expiresInDays', { days })}</Badge>
        ) : null}
      </div>
    );
  }

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
            {t('addLease')}
          </Button>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('owner')}</TableHead>
              <TableHead>{t('contract')}</TableHead>
              <TableHead>{t('parcel')}</TableHead>
              <TableHead>{t('expiryDate')}</TableHead>
              <TableHead>{t('paymentStatus')}</TableHead>
              {canWrite || canDelete ? <TableHead /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length ? (
              data.map((l) => {
                const soon = l.expiry_date ? isExpiringSoon(l.expiry_date, 60) : false;
                return (
                  <TableRow key={l.id} className={cn(soon && 'bg-destructive/10')}>
                    <TableCell className="font-medium">{l.owner_name}</TableCell>
                    <TableCell>{l.contract_number ?? '—'}</TableCell>
                    <TableCell>{l.parcel_code ?? '—'}</TableCell>
                    <TableCell>{expiryCell(l)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary">{t(`method_${l.payment_method}`)}</Badge>
                        <Badge variant={l.payment_status === 'paid' ? 'default' : 'outline'}>
                          {t(`pstatus_${l.payment_status}`)}
                        </Badge>
                      </div>
                    </TableCell>
                    {canWrite || canDelete ? (
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {canWrite ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={tc('edit')}
                              onClick={() => {
                                setEditing(l);
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
                              onClick={() => setDeleting(l)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })
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

      <LeaseForm open={formOpen} onOpenChange={setFormOpen} editing={editing} parcels={parcels} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t('deleteLeaseConfirm')}
        description={deleting?.owner_name}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
