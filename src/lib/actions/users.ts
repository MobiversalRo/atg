'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from '@/lib/users/schema';
import type { Role } from '@/lib/auth/rbac';

export type UserRow = { id: string; email: string; full_name: string | null; role: Role };

const SERVICE_KEY_MISSING =
  'User administration is unavailable: SUPABASE_SERVICE_ROLE_KEY is not set on the server.';

const serviceKeyConfigured = () => Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

/** Returns the current user's id if they are an admin, otherwise null. */
async function currentAdminId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  return profile?.role === 'admin' ? user.id : null;
}

export async function listUsers(): Promise<{ data: UserRow[]; error?: string }> {
  if (!(await currentAdminId())) return { data: [], error: 'Forbidden' };
  if (!serviceKeyConfigured()) return { data: [], error: SERVICE_KEY_MISSING };
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) return { data: [], error: error.message };
  const { data: profiles } = await admin.from('profiles').select('id, role, full_name');
  const pMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const rows: UserRow[] = data.users
    .map((u) => ({
      id: u.id,
      email: u.email ?? '',
      full_name: pMap.get(u.id)?.full_name ?? null,
      role: (pMap.get(u.id)?.role ?? 'operator') as Role,
    }))
    .sort((a, b) => a.email.localeCompare(b.email));
  return { data: rows };
}

export async function createUser(input: CreateUserInput): Promise<{ error?: string }> {
  if (!(await currentAdminId())) return { error: 'Forbidden' };
  if (!serviceKeyConfigured()) return { error: SERVICE_KEY_MISSING };
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.full_name },
  });
  if (error) return { error: error.message };

  // The on_auth_user_created trigger created the profile; set role + name.
  const { error: profileError } = await admin
    .from('profiles')
    .update({ role: parsed.data.role, full_name: parsed.data.full_name })
    .eq('id', data.user.id);
  if (profileError) return { error: profileError.message };

  revalidatePath('/[locale]/users', 'page');
  return {};
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
): Promise<{ error?: string }> {
  if (!(await currentAdminId())) return { error: 'Forbidden' };
  if (!serviceKeyConfigured()) return { error: SERVICE_KEY_MISSING };
  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };

  const admin = createAdminClient();
  const { error } = await admin
    .from('profiles')
    .update({ role: parsed.data.role, full_name: parsed.data.full_name })
    .eq('id', id);
  if (error) return { error: error.message };

  if (parsed.data.password) {
    const { error: pwError } = await admin.auth.admin.updateUserById(id, {
      password: parsed.data.password,
    });
    if (pwError) return { error: pwError.message };
  }

  revalidatePath('/[locale]/users', 'page');
  return {};
}

export async function deleteUser(id: string): Promise<{ error?: string }> {
  const adminId = await currentAdminId();
  if (!adminId) return { error: 'Forbidden' };
  if (!serviceKeyConfigured()) return { error: SERVICE_KEY_MISSING };
  if (id === adminId) return { error: 'You cannot delete your own account.' };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return { error: error.message };

  revalidatePath('/[locale]/users', 'page');
  return {};
}
