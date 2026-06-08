'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { propertySchema, type Property, type PropertyInput } from '@/lib/properties/schema';

export async function listProperties(): Promise<{ data: Property[]; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('properties').select('*').order('name');
  if (error) return { data: [], error: error.message };
  return { data: data ?? [] };
}

export async function createProperty(input: PropertyInput): Promise<{ error?: string }> {
  const parsed = propertySchema.safeParse(input);
  if (!parsed.success) return { error: 'Invalid input' };
  const supabase = await createClient();
  const { error } = await supabase.from('properties').insert(parsed.data);
  if (error) return { error: error.message };
  revalidatePath('/[locale]/properties', 'page');
  return {};
}

export async function updateProperty(
  id: string,
  input: PropertyInput,
): Promise<{ error?: string }> {
  const parsed = propertySchema.safeParse(input);
  if (!parsed.success) return { error: 'Invalid input' };
  const supabase = await createClient();
  const { error } = await supabase.from('properties').update(parsed.data).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/[locale]/properties', 'page');
  return {};
}

export async function deleteProperty(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from('properties').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/[locale]/properties', 'page');
  return {};
}
