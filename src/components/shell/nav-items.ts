import { Building2, FolderArchive, LayoutDashboard, Truck, Users, Wheat, type LucideIcon } from 'lucide-react';
import type { Role } from '@/lib/auth/rbac';

export type NavItem = {
  href: string;
  key: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

/** Shared nav definition used by the desktop sidebar and the mobile sheet. */
export const navItems: NavItem[] = [
  { href: '/', key: 'dashboard', icon: LayoutDashboard },
  { href: '/properties', key: 'properties', icon: Building2 },
  { href: '/farm', key: 'farm', icon: Wheat },
  { href: '/yard', key: 'yard', icon: Truck },
  { href: '/dossiers', key: 'dossiers', icon: FolderArchive },
  { href: '/users', key: 'users', icon: Users, adminOnly: true },
];

export function visibleNavItems(role: Role): NavItem[] {
  return navItems.filter((item) => !item.adminOnly || role === 'admin');
}
