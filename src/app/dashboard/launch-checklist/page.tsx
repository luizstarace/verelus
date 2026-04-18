import { ChecklistClient } from './ChecklistClient';
import { UpgradeGate } from '@/lib/upgrade-gate';

export const runtime = 'edge';

export default function ChecklistPage() {
  return <UpgradeGate><ChecklistClient /></UpgradeGate>;
}
