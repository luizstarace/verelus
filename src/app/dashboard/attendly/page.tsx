import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase-server';
import OverviewDashboard from './OverviewDashboard';

export default async function AttendlyDashboardPage() {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <OverviewDashboard />;
}
