import { z } from 'zod';
import type { Database } from '@/lib/supabase/types';

export type YardTruck = Database['public']['Tables']['yard_trucks']['Row'];

export const YARD_STATUSES = ['gate', 'scale', 'dock', 'exited'] as const;
export type YardStatus = (typeof YARD_STATUSES)[number];

export const YARD_DIRECTIONS = ['inbound', 'outbound'] as const;

const emptyToNull = (v: unknown) => (v === '' || v === undefined ? null : v);

export const truckSchema = z.object({
  plate_number: z.string().min(1, 'Plate number is required'),
  driver: z.preprocess(emptyToNull, z.string().nullable()),
  cargo_crop_id: z.preprocess(emptyToNull, z.string().nullable()),
  direction: z.enum(YARD_DIRECTIONS),
});
export type TruckInput = z.infer<typeof truckSchema>;

export const weightsSchema = z.object({
  gross_weight: z.preprocess(emptyToNull, z.coerce.number().min(0).nullable()),
  tare_weight: z.preprocess(emptyToNull, z.coerce.number().min(0).nullable()),
});
export type WeightsInput = z.infer<typeof weightsSchema>;
