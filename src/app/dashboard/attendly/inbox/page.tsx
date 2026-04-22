export const runtime = 'edge';

import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase-server';
import InboxView from './InboxView';

export default async function InboxPage() {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <InboxView />;
}
