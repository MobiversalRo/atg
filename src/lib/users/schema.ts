import { z } from 'zod';

export const USER_ROLES = ['admin', 'manager', 'operator', 'accountant'] as const;

const emptyToNull = (v: unknown) => (v === '' || v === undefined ? null : v);
const isEmail = (v: string) => /.+@.+\..+/.test(v);

export const createUserSchema = z.object({
  email: z.string().trim().toLowerCase().refine(isEmail, 'Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.preprocess(emptyToNull, z.string().nullable()),
  role: z.enum(USER_ROLES),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  full_name: z.preprocess(emptyToNull, z.string().nullable()),
  role: z.enum(USER_ROLES),
  // Optional password reset — blank keeps the current password.
  password: z.preprocess(emptyToNull, z.string().min(6).nullable()),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
