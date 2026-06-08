'use client';

import * as React from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { useSession } from '@/components/auth/session-provider';
import { can } from '@/lib/auth/rbac';
import type { Crop } from '@/lib/farm/schema';
import { YARD_STATUSES, type YardStatus } from '@/lib/yard/schema';
import { deleteTruck, updateTruckStatus, type TruckRow } from '@/lib/actions/yard';
import { TruckCard } from './truck-card';
import { TruckForm } from './truck-form';
import { WeighDialog } from './weigh-dialog';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';

function Column({
  status,
  title,
  trucks,
  canWrite,
  canDelete,
  onWeigh,
  onEdit,
  onDelete,
}: {
  status: YardStatus;
  title: string;
  trucks: TruckRow[];
  canWrite: boolean;
  canDelete: boolean;
  onWeigh: (truck: TruckRow) => void;
  onEdit: (truck: TruckRow) => void;
  onDelete: (truck: TruckRow) => void;
}) {
  const tc = useTranslations('common');
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      data-testid={`col-${status}`}
      className={cn(
        'flex min-h-40 flex-col gap-2 rounded-lg border bg-muted/30 p-3 transition-colors',
        isOver && 'ring-2 ring-ring',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">{trucks.length}</span>
      </div>
      {trucks.length ? (
        trucks.map((truck) => (
          <TruckCard
            key={truck.id}
            truck={truck}
            canWrite={canWrite}
            canDelete={canDelete}
            onWeigh={onWeigh}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      ) : (
        <p className="py-4 text-center text-xs text-muted-foreground">{tc('noData')}</p>
      )}
    </div>
  );
}

export function KanbanBoard({ trucks, crops }: { trucks: TruckRow[]; crops: Crop[] }) {
  const t = useTranslations('yard');
  const tc = useTranslations('common');
  const router = useRouter();
  const { role } = useSession();
  const canWrite = can(role, 'yard_trucks', 'update');
  const canCreate = can(role, 'yard_trucks', 'create');
  const canDelete = can(role, 'yard_trucks', 'delete');

  const [optimisticTrucks, applyOptimistic] = React.useOptimistic(
    trucks,
    (current, update: { id: string; status: YardStatus }) =>
      current.map((tr) => (tr.id === update.id ? { ...tr, status: update.status } : tr)),
  );
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<TruckRow | null>(null);
  const [weighing, setWeighing] = React.useState<TruckRow | null>(null);
  const [deleting, setDeleting] = React.useState<TruckRow | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  function onDragEnd(event: DragEndEvent) {
    const id = String(event.active.id);
    const over = event.over ? String(event.over.id) : null;
    if (!over || !YARD_STATUSES.includes(over as YardStatus)) return;
    const truck = optimisticTrucks.find((tr) => tr.id === id);
    const status = over as YardStatus;
    if (!truck || truck.status === status) return;

    React.startTransition(async () => {
      applyOptimistic({ id, status });
      const res = await updateTruckStatus(id, status);
      if (res?.error) toast.error(res.error);
      router.refresh();
    });
  }

  async function confirmDelete() {
    if (!deleting) return;
    const res = await deleteTruck(deleting.id);
    setDeleting(null);
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    toast.success(tc('deleted'));
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        {canCreate ? (
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            {t('addTruck')}
          </Button>
        ) : null}
      </div>

      <DndContext id="yard-kanban" sensors={sensors} onDragEnd={onDragEnd}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {YARD_STATUSES.map((status) => (
            <Column
              key={status}
              status={status}
              title={t(`status_${status}`)}
              trucks={optimisticTrucks.filter((tr) => tr.status === status)}
              canWrite={canWrite}
              canDelete={canDelete}
              onWeigh={setWeighing}
              onEdit={(truck) => {
                setEditing(truck);
                setFormOpen(true);
              }}
              onDelete={setDeleting}
            />
          ))}
        </div>
      </DndContext>

      <TruckForm open={formOpen} onOpenChange={setFormOpen} editing={editing} crops={crops} />
      <WeighDialog truck={weighing} onOpenChange={(o) => !o && setWeighing(null)} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t('deleteTruckConfirm')}
        description={deleting?.plate_number}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
