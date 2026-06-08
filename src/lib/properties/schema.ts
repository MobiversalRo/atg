import { z } from 'zod';
import type { Database } from '@/lib/supabase/types';

export type Property = Database['public']['Tables']['properties']['Row'];

export const PROPERTY_TYPES = [
  'residential',
  'industrial_hall',
  'agricultural_land',
  'silo_storage',
] as const;
export const PROPERTY_STATUSES = ['rented', 'vacant', 'conservation', 'own_use'] as const;
export const CURRENCIES = ['RON', 'EUR'] as const;
export const AREA_UNITS = ['sqm', 'hectare'] as const;

const emptyToNull = (v: unknown) => (v === '' || v === undefined ? null : v);

export const propertySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(PROPERTY_TYPES),
  area_value: z.coerce.number().min(0),
  area_unit: z.enum(AREA_UNITS),
  status: z.enum(PROPERTY_STATUSES),
  accounting_value: z.coerce.number().min(0),
  currency: z.enum(CURRENCIES),
  energy_class: z.preprocess(emptyToNull, z.string().nullable()),
  year_built: z.preprocess(emptyToNull, z.coerce.number().int().min(0).max(3000).nullable()),
  thermal_insulation: z.preprocess((v) => v ?? false, z.boolean()),
});

export type PropertyInput = z.infer<typeof propertySchema>;
