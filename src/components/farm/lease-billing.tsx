'use client';

import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { useSession } from '@/components/auth/session-provider';
import { can } from '@/lib/auth/rbac';
import { sqmToHa } from '@/lib/domain/area';
import { formatDate } from '@/lib/domain/date';
import { setLeasePaymentStatus, type LeaseBillingRow } from '@/lib/actions/leases';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export function LeaseBilling({ data }: { data: LeaseBillingRow[] }) {
  const t = useTranslations('farm');
  const tc = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const { role } = useSession();
  const canUpdate = can(role, 'leases', 'update');
  const nf = new Intl.NumberFormat(locale === 'ro' ? 'ro-RO' : 'en-US');
  const totalAmount = data.reduce((s, r) => s + (r.amount ?? 0), 0);
  const totalAreaSqm = data.reduce((s, r) => s + r.area_sqm, 0);

  async function toggle(r: LeaseBillingRow) {
    const next = r.payment_status === 'paid' ? 'unpaid' : 'paid';
    const res = await setLeasePaymentStatus(r.id, next);
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    toast.success(tc('saved'));
    router.refresh();
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('owner')}</TableHead>
            <TableHead>{t('parcel')}</TableHead>
            <TableHead>{t('contract')}</TableHead>
            <TableHead>{t('expiryDate')}</TableHead>
            <TableHead>{t('areaHa')}</TableHead>
            <TableHead>{t('amount')}</TableHead>
            <TableHead>{t('paymentStatus')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length ? (
            <>
              {data.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.owner_name}</TableCell>
                  <TableCell>{r.parcel_label ?? '—'}</TableCell>
                  <TableCell>{r.contract_number ?? '—'}</TableCell>
                  <TableCell>{formatDate(r.expiry_date) || '—'}</TableCell>
                  <TableCell>
                    {nf.format(sqmToHa(r.area_sqm))} {t('haShort')}
                  </TableCell>
                  <TableCell>{r.amount != null ? nf.format(r.amount) : '—'}</TableCell>
                  <TableCell>
                    {canUpdate ? (
                      <Button variant="outline" size="sm" onClick={() => toggle(r)}>
                        {r.payment_status === 'paid' ? t('pstatus_paid') : t('pstatus_unpaid')}
                      </Button>
                    ) : (
                      <span>
                        {r.payment_status === 'paid' ? t('pstatus_paid') : t('pstatus_unpaid')}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-medium">
                <TableCell colSpan={4}>{t('total')}</TableCell>
                <TableCell>
                  {nf.format(sqmToHa(totalAreaSqm))} {t('haShort')}
                </TableCell>
                <TableCell>{nf.format(totalAmount)}</TableCell>
                <TableCell />
              </TableRow>
            </>
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                {tc('noData')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
