export const runtime = 'edge';

import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase-server';
import PlaygroundView from './PlaygroundView';

export default async function PlaygroundPage() {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <PlaygroundView />;
}
