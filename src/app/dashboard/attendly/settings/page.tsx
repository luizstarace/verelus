export const runtime = 'edge';

import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase-server';
import SettingsView from './SettingsView';

export default async function SettingsPage() {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <SettingsView />;
}
