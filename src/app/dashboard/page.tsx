import { redirect } from 'next/navigation';

export const runtime = 'edge';

export default function DashboardHome() {
  redirect('/dashboard/atalaia');
}
