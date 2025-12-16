import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map(c => ({
            name: c.name,
            value: c.value,
          }));
        },
        setAll(_cookies: {
          name: string;
          value: string;
          options: CookieOptions;
        }[]) {
          // ❗ DO NOTHING IN LAYOUT / SERVER COMPONENT
        },
      },
    }
  );
}
