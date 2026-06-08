'use server';

import { createClient } from '@/lib/supabase/server';
import type { Crop } from '@/lib/farm/schema';

export async function listCrops(): Promise<Crop[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('crops').select('*').order('name');
  return data ?? [];
}
