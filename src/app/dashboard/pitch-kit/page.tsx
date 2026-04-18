import { PitchKitClient } from './PitchKitClient';
import { UpgradeGate } from '@/lib/upgrade-gate';

export const runtime = 'edge';

export default function PitchKitPage() {
  return <UpgradeGate><PitchKitClient /></UpgradeGate>;
}
