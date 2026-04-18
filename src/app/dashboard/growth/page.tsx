import { GrowthTabs } from './GrowthTabs';
import { UpgradeGate } from '@/lib/upgrade-gate';

export const runtime = 'edge';

export default function GrowthPage() {
  return <UpgradeGate><GrowthTabs /></UpgradeGate>;
}
