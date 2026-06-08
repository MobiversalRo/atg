import { Building2, LayoutDashboard, Truck, Wheat } from 'lucide-react';

/** Shared nav definition used by the desktop sidebar and the mobile sheet. */
export const navItems = [
  { href: '/', key: 'dashboard', icon: LayoutDashboard },
  { href: '/properties', key: 'properties', icon: Building2 },
  { href: '/farm', key: 'farm', icon: Wheat },
  { href: '/yard', key: 'yard', icon: Truck },
] as const;
