'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useSession } from '@/components/auth/session-provider';
import { can } from '@/lib/auth/rbac';
import type { Crop } from '@/lib/farm/schema';
import type { EnrichedSegment, SiloViewEnriched } from '@/lib/actions/inventory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InventoryForm } from './inventory-form';

const TRACK = '#e5e7eb';

function Donut({ segments, fillPct }: { segments: EnrichedSegment[]; fillPct: number }) {
  const stops = segments.map((s) => `${s.color} ${s.startPct}% ${s.endPct}%`).join(', ');
  const lastEnd = segments.length ? segments[segments.length - 1].endPct : 0;
  const background = `conic-gradient(${stops}${stops ? ', ' : ''}${TRACK} ${lastEnd}% 100%)`;
  return (
    <div className="relative size-28 shrink-0 rounded-full" style={{ background }}>
      <div className="absolute inset-[14px] flex items-center justify-center rounded-full bg-card text-base font-semibold">
        {Math.round(fillPct)}%
      </div>
    </div>
  );
}

export function SiloBoard({
  silos,
  crops,
}: {
  silos: SiloViewEnriched[];
  crops: Crop[];
}) {
  const t = useTranslations('farm');
  const locale = useLocale();
  const { role } = useSession();
  const nf = new Intl.NumberFormat(locale === 'ro' ? 'ro-RO' : 'en-US');

  return (
    <div className="flex flex-col gap-4">
      {can(role, 'inventory', 'create') ? (
        <InventoryForm
          facilities={silos.map((s) => ({ id: s.id, name: s.name }))}
          crops={crops}
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {silos.map((s) => (
          <Card key={s.id}>
            <CardHeader>
              <CardTitle className="text-base">{s.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Donut segments={s.segments} fillPct={s.fillPct} />
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium">
                  {nf.format(s.load)} / {nf.format(s.capacity)} {t('tons')}
                </p>
                <ul className="mt-2 space-y-1">
                  {s.segments.length ? (
                    s.segments.map((seg) => (
                      <li key={seg.cropId} className="flex items-center gap-2 text-muted-foreground">
                        <span
                          className="inline-block size-3 shrink-0 rounded-sm"
                          style={{ backgroundColor: seg.color }}
                        />
                        <span className="truncate">{seg.name}</span>
                        <span className="ml-auto">{nf.format(seg.tons)}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-muted-foreground">{t('empty')}</li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
