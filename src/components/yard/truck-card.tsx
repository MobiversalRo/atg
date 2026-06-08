'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Scale } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { TruckRow } from '@/lib/actions/yard';
import { netWeight } from '@/lib/domain/weights';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function TruckCard({
  truck,
  canWrite,
  onWeigh,
}: {
  truck: TruckRow;
  canWrite: boolean;
  onWeigh: (truck: TruckRow) => void;
}) {
  const t = useTranslations('yard');
  const locale = useLocale();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: truck.id,
    disabled: !canWrite,
  });
  const nf = new Intl.NumberFormat(locale === 'ro' ? 'ro-RO' : 'en-US');
  const net = netWeight(Number(truck.gross_weight ?? 0), Number(truck.tare_weight ?? 0));

  return (
    <div
      ref={setNodeRef}
      data-plate={truck.plate_number}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        'rounded-md border bg-card p-3 shadow-xs',
        isDragging && 'opacity-50',
      )}
    >
      <div className="flex items-start gap-2">
        {canWrite ? (
          <button
            type="button"
            {...listeners}
            {...attributes}
            aria-label={t('drag')}
            className="mt-0.5 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
          >
            <GripVertical className="size-4" />
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="font-medium">{truck.plate_number}</p>
          <p className="text-sm text-muted-foreground">{truck.driver ?? '—'}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {truck.crop_name ? <span>{truck.crop_name}</span> : null}
            {net > 0 ? (
              <span>
                {truck.crop_name ? ' · ' : ''}
                {nf.format(net)} {t('kg')}
              </span>
            ) : null}
          </p>
        </div>
        {canWrite ? (
          <Button variant="ghost" size="icon" aria-label={t('weigh')} onClick={() => onWeigh(truck)}>
            <Scale className="size-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
