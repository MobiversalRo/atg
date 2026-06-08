import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocaleSwitcher } from './locale-switcher';
import { MobileNav } from './mobile-nav';

export function Topbar() {
  return (
    <header className="flex h-14 items-center gap-2 border-b px-4">
      <MobileNav />
      <span className="font-semibold md:hidden">ERP Hibrid ATG</span>
      <div className="ml-auto flex items-center gap-2">
        <LocaleSwitcher />
        {/* TODO(auth): replace with a user menu + sign out once Supabase auth lands (Task 0.5) */}
        <Button variant="ghost" size="icon" aria-label="Account">
          <User className="size-5" />
        </Button>
      </div>
    </header>
  );
}
