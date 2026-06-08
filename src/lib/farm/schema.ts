import { z } from 'zod';
import type { Database } from '@/lib/supabase/types';

export type Parcel = Database['public']['Tables']['parcels']['Row'];
export type Lease = Database['public']['Tables']['leases']['Row'];
export type Crop = Database['public']['Tables']['crops']['Row'];
export type StorageFacility = Database['public']['Tables']['storage_facilities']['Row'];

export const PAYMENT_METHODS = ['cash', 'in_kind'] as const;
export const PAYMENT_STATUSES = ['paid', 'unpaid'] as const;
export const TXN_TYPES = ['in', 'out'] as const;

const emptyToNull = (v: unknown) => (v === '' || v === undefined ? null : v);

export const parcelSchema = z.object({
  topo_code: z.string().min(1, 'Topo code is required'),
  area_ha: z.coerce.number().min(0),
  current_crop_id: z.preprocess(emptyToNull, z.string().nullable()),
  property_id: z.preprocess(emptyToNull, z.string().nullable()),
  notes: z.preprocess(emptyToNull, z.string().nullable()),
});
export type ParcelInput = z.infer<typeof parcelSchema>;

export const leaseSchema = z.object({
  parcel_id: z.preprocess(emptyToNull, z.string().nullable()),
  owner_name: z.string().min(1, 'Owner is required'),
  owner_id_code: z.preprocess(emptyToNull, z.string().nullable()),
  contract_number: z.preprocess(emptyToNull, z.string().nullable()),
  start_date: z.preprocess(emptyToNull, z.string().nullable()),
  expiry_date: z.preprocess(emptyToNull, z.string().nullable()),
  payment_method: z.enum(PAYMENT_METHODS),
  payment_status: z.enum(PAYMENT_STATUSES),
  amount: z.preprocess(emptyToNull, z.coerce.number().min(0).nullable()),
});
export type LeaseInput = z.infer<typeof leaseSchema>;

export const stockTxnSchema = z.object({
  facility_id: z.string().min(1),
  crop_id: z.string().min(1),
  txn_type: z.enum(TXN_TYPES),
  quantity_ton: z.coerce.number().positive(),
});
export type StockTxnInput = z.infer<typeof stockTxnSchema>;
