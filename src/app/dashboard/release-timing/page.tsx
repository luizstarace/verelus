import { ReleaseTimingClient } from './ReleaseTimingClient';
import { UpgradeGate } from '@/lib/upgrade-gate';

export const runtime = 'edge';

export default function ReleaseTimingPage() {
  return <UpgradeGate><ReleaseTimingClient /></UpgradeGate>;
}
