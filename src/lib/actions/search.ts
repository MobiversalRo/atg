'use server';

import { createClient } from '@/lib/supabase/server';

export type SearchHit = { kind: string; id: string; label: string | null; sub: string | null };

export async function searchAll(q: string): Promise<SearchHit[]> {
  if (q.trim().length < 2) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('search_all', { q });
  if (error) return [];
  return (data ?? []) as SearchHit[];
}
