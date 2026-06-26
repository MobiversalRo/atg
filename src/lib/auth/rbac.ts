export type Role = 'admin' | 'manager' | 'operator' | 'accountant';

export type Resource =
  | 'properties' | 'parcels' | 'leases' | 'storage' | 'inventory'
  | 'yard_trucks' | 'users' | 'dossiers' | 'documents' | 'notifications';

export type Action = 'create' | 'read' | 'update' | 'delete';

const MANAGER_WRITE: Resource[] = ['properties', 'parcels', 'leases', 'storage', 'inventory', 'dossiers'];

/**
 * Mirrors the database RLS policies so the UI can hide/disable controls the
 * current role may not use. RLS in Postgres remains the real boundary.
 * CF-4: nothing is hard-deletable; 'delete' on dossiers means admin-only soft archive.
 */
export function can(role: Role, resource: Resource, action: Action): boolean {
  // Documents: never deletable (CF-4); read by all; create/update by admin+manager+operator.
  if (resource === 'documents') {
    if (action === 'delete') return false;
    if (action === 'read') return true;
    return role === 'admin' || role === 'manager' || role === 'operator';
  }
  // Soft-archive of structural records is admin-only.
  if (action === 'delete' && (resource === 'dossiers' || resource === 'parcels')) return role === 'admin';

  if (role === 'admin') return true;
  if (resource === 'users') return false;            // admin-only (handled above)
  if (action === 'read') return true;                 // everyone reads

  if (role === 'manager') return MANAGER_WRITE.includes(resource);

  if (role === 'accountant') {
    return resource === 'leases' && (action === 'create' || action === 'update');
  }

  // operator
  if (resource === 'yard_trucks') return true;
  if (resource === 'inventory' && action === 'create') return true;
  return false;
}
