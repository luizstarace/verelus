import { GrowthTabs } from '../growth/GrowthTabs';
import { UpgradeGate } from '@/lib/upgrade-gate';

export const runtime = 'edge';

export default function GoalsPage() {
  return <UpgradeGate><GrowthTabs initialTab="goals" /></UpgradeGate>;
}
