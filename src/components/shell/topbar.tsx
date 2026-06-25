import { GlobalSearch } from '@/components/search/global-search';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { LocaleSwitcher } from './locale-switcher';
import { MobileNav } from './mobile-nav';
import { UserMenu } from './user-menu';

export function Topbar() {
  return (
    <header className="flex h-14 items-center gap-2 border-b px-4">
      <MobileNav />
      <span className="font-semibold md:hidden">ERP Hibrid ATG</span>
      <div className="w-full max-w-sm">
        <GlobalSearch />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <NotificationBell />
        <LocaleSwitcher />
        <UserMenu />
      </div>
    </header>
  );
}
