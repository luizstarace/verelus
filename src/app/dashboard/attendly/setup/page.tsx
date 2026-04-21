import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase-server';
import SetupWizard from './SetupWizard';

export default async function SetupPage() {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <SetupWizard />;
}
