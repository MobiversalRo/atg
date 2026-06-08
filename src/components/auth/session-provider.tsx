'use client';

import { createContext, useContext } from 'react';
import type { Role } from '@/lib/auth/rbac';

export type Session = {
  userId: string;
  email: string;
  fullName: string | null;
  role: Role;
};

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({
  value,
  children,
}: {
  value: Session;
  children: React.ReactNode;
}) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/** Current user's session (id, email, name, role). Available inside the (app) shell. */
export function useSession(): Session {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return ctx;
}
