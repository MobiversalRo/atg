import { afterAll, beforeAll, expect, test } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Uses the local stack. Skips automatically if env is absent.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const run = anon ? test : test.skip;

let supabase: ReturnType<typeof createClient>;
let dossierId: string;

beforeAll(async () => {
  supabase = createClient(url, anon);
  await supabase.auth.signInWithPassword({ email: 'admin@atg.local', password: 'password123' });
  const { data } = await supabase.from('dossiers').select('id').eq('dossier_number', '101').single();
  dossierId = data!.id as string;
});

afterAll(async () => {
  await supabase.auth.signOut();
});

run('CF-4: an admin cannot hard-delete a dossier', async () => {
  await supabase.from('dossiers').delete().eq('id', dossierId);
  const { data } = await supabase.from('dossiers').select('id').eq('id', dossierId);
  expect(data).toHaveLength(1); // RLS denied the delete; row survives
});
