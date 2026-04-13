import { createBrowserClient } from '@supabase/ssr';

let _instance: ReturnType<typeof createBrowserClient> | null = null;

function getClient() {
  if (!_instance) {
    _instance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _instance;
}

// Lazy-initialized singleton — safe for SSR/build since createBrowserClient
// is only called on first property access (which only happens in the browser).
export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});
