'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { searchAll, type SearchHit } from '@/lib/actions/search';
import { Input } from '@/components/ui/input';

function hrefFor(h: SearchHit): string {
  return h.kind === 'dossier' || h.kind === 'document' ? `/dossiers/${h.id}` : '/farm';
}

export function GlobalSearch() {
  const t = useTranslations('common');
  const [q, setQ] = React.useState('');
  const [hits, setHits] = React.useState<SearchHit[]>([]);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const id = setTimeout(async () => {
      if (q.trim().length < 2) {
        setHits([]);
        setOpen(false);
        return;
      }
      const res = await searchAll(q);
      setHits(res);
      setOpen(true);
    }, 250);
    return () => clearTimeout(id);
  }, [q]);

  return (
    <div className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        aria-label={t('search')}
        placeholder={t('search')}
        className="pl-8"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => hits.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && hits.length > 0 ? (
        <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md">
          {hits.map((h) => (
            <li key={`${h.kind}-${h.id}`}>
              <Link
                href={hrefFor(h)}
                className="flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-accent"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setOpen(false);
                  setQ('');
                }}
              >
                <span className="truncate">{h.label}</span>
                <span className="ml-2 shrink-0 text-xs text-muted-foreground">{h.sub ?? h.kind}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
