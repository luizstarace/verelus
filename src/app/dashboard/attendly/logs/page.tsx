export const runtime = 'edge';

import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase-server';
import LogsView from './LogsView';

export default async function AttendlyLogsPage() {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <LogsView />;
}
