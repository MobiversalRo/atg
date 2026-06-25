'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onConfirm: () => void;
  confirmLabel?: string;
}) {
  const tc = useTranslations('common');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tc('cancel')}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {confirmLabel ?? tc('delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
