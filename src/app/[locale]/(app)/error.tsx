'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AppError({ reset }: { reset: () => void }) {
  const t = useTranslations('common');
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <AlertTriangle className="size-8 text-destructive" />
      <h2 className="text-lg font-semibold">{t('error')}</h2>
      <Button onClick={reset}>{t('retry')}</Button>
    </div>
  );
}
