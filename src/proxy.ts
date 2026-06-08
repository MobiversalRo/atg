import { type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { routing } from '@/i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  // 1. next-intl resolves the locale (and may redirect, e.g. "/" -> "/ro").
  const response = intlMiddleware(request);

  // 2. Refresh the Supabase auth session, writing any rotated cookies onto
  //    the response so Server Components see a current session.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Match all paths except API routes, Next internals, and files with an extension.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
