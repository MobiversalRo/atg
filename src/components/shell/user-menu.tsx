'use client';

import { LogOut, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/browser';
import { useSession } from '@/components/auth/session-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function UserMenu() {
  const t = useTranslations('common');
  const session = useSession();
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" aria-label="Account" />}
      >
        <User className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <div className="px-1.5 py-1">
          <span className="block text-sm font-medium text-foreground">
            {session.fullName ?? session.email}
          </span>
          <span className="block text-xs capitalize text-muted-foreground">
            {session.role}
          </span>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={signOut}>
          <LogOut className="size-4" />
          {t('signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
