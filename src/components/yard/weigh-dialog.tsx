'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { weightsSchema } from '@/lib/yard/schema';
import { updateTruckWeights, type TruckRow } from '@/lib/actions/yard';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function WeighDialog({
  truck,
  onOpenChange,
}: {
  truck: TruckRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!truck} onOpenChange={onOpenChange}>
      <DialogContent>
        {truck ? <WeighBody key={truck.id} truck={truck} onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function WeighBody({ truck, onDone }: { truck: TruckRow; onDone: () => void }) {
  const t = useTranslations('yard');
  const tc = useTranslations('common');
  const router = useRouter();
  const [gross, setGross] = React.useState(truck.gross_weight?.toString() ?? '');
  const [tare, setTare] = React.useState(truck.tare_weight?.toString() ?? '');
  const [busy, setBusy] = React.useState(false);

  async function save() {
    const parsed = weightsSchema.safeParse({ gross_weight: gross, tare_weight: tare });
    if (!parsed.success) {
      toast.error(tc('invalid'));
      return;
    }
    setBusy(true);
    const res = await updateTruckWeights(truck.id, parsed.data);
    setBusy(false);
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    toast.success(tc('saved'));
    onDone();
    router.refresh();
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {t('weigh')} · {truck.plate_number}
        </DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-3 py-2">
        <div className="grid gap-1.5">
          <Label>{t('grossWeight')}</Label>
          <Input type="number" value={gross} onChange={(e) => setGross(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label>{t('tareWeight')}</Label>
          <Input type="number" value={tare} onChange={(e) => setTare(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onDone}>
          {tc('cancel')}
        </Button>
        <Button onClick={save} disabled={busy}>
          {tc('save')}
        </Button>
      </DialogFooter>
    </>
  );
}
