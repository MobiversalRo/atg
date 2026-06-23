'use client';

import { useLocale, useTranslations } from 'next-intl';
import { BellRing, Landmark, Layers } from 'lucide-react';
import type { PortfolioReport } from '@/lib/actions/reports';
import { INTABULARE_STATUSES } from '@/lib/farm/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ReportCards({ report }: { report: PortfolioReport }) {
  const t = useTranslations('reports');
  const tf = useTranslations('farm');
  const locale = useLocale();
  const nf = new Intl.NumberFormat(locale === 'ro' ? 'ro-RO' : 'en-US');
  const ha = tf('haShort');
  const statusSet = new Set<string>(INTABULARE_STATUSES);
  const statusLabel = (k: string) => (statusSet.has(k) ? tf(`istatus_${k}`) : k);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('totalParcels')}</CardTitle>
            <Landmark className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{nf.format(report.totalParcels)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('totalArea')}</CardTitle>
            <Layers className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {nf.format(report.totalAreaHa)} {ha}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('leasesDue')}</CardTitle>
            <BellRing className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{nf.format(report.leasesDueSoon)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('areaByUat')}</CardTitle>
          </CardHeader>
          <CardContent>
            {report.areaByUat.length ? (
              <ul className="space-y-1 text-sm">
                {report.areaByUat.map((r) => (
                  <li key={r.key} className="flex justify-between gap-2">
                    <span className="truncate">{r.key}</span>
                    <span className="font-medium">
                      {nf.format(r.ha)} {ha}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('areaByStatus')}</CardTitle>
          </CardHeader>
          <CardContent>
            {report.areaByStatus.length ? (
              <ul className="space-y-1 text-sm">
                {report.areaByStatus.map((r) => (
                  <li key={r.key} className="flex justify-between gap-2">
                    <span className="truncate">{statusLabel(r.key)}</span>
                    <span className="font-medium">
                      {nf.format(r.ha)} {ha}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
