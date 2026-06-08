'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MoreVertical, Pencil, Scale, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { TruckRow } from '@/lib/actions/yard';
import { netWeight } from '@/lib/domain/weights';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export function TruckCard({
  truck,
  canWrite,
  canDelete,
  onWeigh,
  onEdit,
  onDelete,
}: {
  truck: TruckRow;
  canWrite: boolean;
  canDelete: boolean;
  onWeigh: (truck: TruckRow) => void;
  onEdit: (truck: TruckRow) => void;
  onDelete: (truck: TruckRow) => void;
}) {
  const t = useTranslations('yard');
  const tc = useTranslations('common');
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
      className={cn('rounded-md border bg-card p-3 shadow-xs', isDragging && 'opacity-50')}
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
        {canWrite || canDelete ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon" aria-label={tc('actions')} />}
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canWrite ? (
                <DropdownMenuItem onClick={() => onWeigh(truck)}>
                  <Scale className="size-4" />
                  {t('weigh')}
                </DropdownMenuItem>
              ) : null}
              {canWrite ? (
                <DropdownMenuItem onClick={() => onEdit(truck)}>
                  <Pencil className="size-4" />
                  {tc('edit')}
                </DropdownMenuItem>
              ) : null}
              {canDelete ? (
                <DropdownMenuItem variant="destructive" onClick={() => onDelete(truck)}>
                  <Trash2 className="size-4" />
                  {tc('delete')}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </div>
  );
}
