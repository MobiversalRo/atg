import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AlertTriangle, Building2, TrendingUp, Wheat } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { getDashboard } from '@/lib/actions/dashboard';
import { formatDate } from '@/lib/domain/date';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('dashboard');
  const data = await getDashboard();
  const nf = new Intl.NumberFormat(locale === 'ro' ? 'ro-RO' : 'en-US');

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('totalArea')}
            </CardTitle>
            <Building2 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {nf.format(data.area.hectare)} {t('haShort')}
            </p>
            <p className="text-sm text-muted-foreground">
              {nf.format(data.area.sqm)} {t('sqmShort')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('patrimony')}
            </CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {Object.keys(data.patrimony).length ? (
              Object.entries(data.patrimony).map(([currency, value]) => (
                <p key={currency} className="text-2xl font-semibold">
                  {nf.format(value)} <span className="text-base font-normal">{currency}</span>
                </p>
              ))
            ) : (
              <p className="text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('grainStock')}
            </CardTitle>
            <Wheat className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data.stock.length ? (
              <ul className="space-y-1 text-sm">
                {data.stock.map((s) => (
                  <li key={s.name} className="flex items-center gap-2">
                    <span
                      className="inline-block size-3 shrink-0 rounded-sm"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="truncate">{s.name}</span>
                    <span className="ml-auto font-medium">
                      {nf.format(s.tons)} {t('tons')}
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
          <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('alerts')}
            </CardTitle>
            <AlertTriangle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{data.expiringLeases.length}</p>
            {data.expiringLeases.length ? (
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {data.expiringLeases.map((l) => (
                  <li key={l.id} className="flex justify-between gap-2">
                    <span className="truncate">{l.owner_name}</span>
                    <span className="shrink-0">{formatDate(l.expiry_date)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{t('noAlerts')}</p>
            )}
            <Link href="/farm" className="mt-2 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline">
              {t('viewLeases')}
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
