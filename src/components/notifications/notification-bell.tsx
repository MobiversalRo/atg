'use client';

import * as React from 'react';
import { Bell } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { useSession } from '@/components/auth/session-provider';
import {
  generateLeaseNotifications,
  listMyNotifications,
  markNotificationRead,
  type MyNotification,
} from '@/lib/actions/notifications';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/domain/date';

export function NotificationBell() {
  const t = useTranslations('notifications');
  const router = useRouter();
  const { role } = useSession();
  const canGenerate = role === 'admin';
  const [items, setItems] = React.useState<MyNotification[]>([]);
  const [open, setOpen] = React.useState(false);

  const load = React.useCallback(() => {
    listMyNotifications().then(setItems);
  }, []);
  React.useEffect(() => {
    load();
  }, [load]);

  async function check() {
    const res = await generateLeaseNotifications();
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(t('checked', { count: res.created }));
    load();
  }

  async function markRead(id: string) {
    await markNotificationRead(id);
    setItems((prev) => prev.filter((n) => n.id !== id));
    router.refresh();
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label={t('title')}
        className="relative"
        onClick={() => setOpen((o) => !o)}
      >
        <Bell className="size-4" />
        {items.length > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
            {items.length}
          </span>
        ) : null}
      </Button>
      {open ? (
        <div className="absolute right-0 z-50 mt-1 w-80 rounded-md border bg-popover p-2 text-popover-foreground shadow-md">
          <div className="flex items-center justify-between px-1 pb-2">
            <span className="text-sm font-medium">{t('title')}</span>
            {canGenerate ? (
              <Button variant="outline" size="sm" onClick={check}>
                {t('check')}
              </Button>
            ) : null}
          </div>
          {items.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {items.map((n) => (
                <li
                  key={n.id}
                  className="flex items-center justify-between gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <span>
                    {t(`type_${n.type}`)}
                    {n.due_date ? ` · ${formatDate(n.due_date)}` : ''}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => markRead(n.id)}>
                    {t('markRead')}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-2 py-3 text-sm text-muted-foreground">{t('empty')}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
