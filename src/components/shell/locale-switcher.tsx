'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const next = locale === 'ro' ? 'en' : 'ro';

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => router.replace(pathname, { locale: next })}
      aria-label={`Switch language to ${next.toUpperCase()}`}
    >
      {locale.toUpperCase()} → {next.toUpperCase()}
    </Button>
  );
}
