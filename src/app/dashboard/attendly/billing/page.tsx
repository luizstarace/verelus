import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase-server';
import BillingView from './BillingView';

export default async function BillingPage() {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <BillingView />;
}
