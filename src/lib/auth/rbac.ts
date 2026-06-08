export type Role = 'admin' | 'manager' | 'operator';

export type Resource =
  | 'properties'
  | 'parcels'
  | 'leases'
  | 'storage'
  | 'inventory'
  | 'yard_trucks';

export type Action = 'create' | 'read' | 'update' | 'delete';

const MANAGER_WRITE: Resource[] = [
  'properties',
  'parcels',
  'leases',
  'storage',
  'inventory',
];

/**
 * Mirrors the database RLS policies so the UI can hide/disable controls the
 * current role is not allowed to use. RLS in Postgres remains the real boundary.
 */
export function can(role: Role, resource: Resource, action: Action): boolean {
  if (role === 'admin') return true;
  if (action === 'read') return true;
  if (role === 'manager') return MANAGER_WRITE.includes(resource);
  // operator
  if (resource === 'yard_trucks') return true;
  if (resource === 'inventory' && action === 'create') return true;
  return false;
}
