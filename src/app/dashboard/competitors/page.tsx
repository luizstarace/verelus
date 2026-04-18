import { GrowthTabs } from '../growth/GrowthTabs';
import { UpgradeGate } from '@/lib/upgrade-gate';

export const runtime = 'edge';

export default function CompetitorsPage() {
  return <UpgradeGate><GrowthTabs initialTab="competitors" /></UpgradeGate>;
}
