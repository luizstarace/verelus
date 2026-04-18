import { ContentCalendarClient } from './ContentCalendarClient';
import { UpgradeGate } from '@/lib/upgrade-gate';

export const runtime = 'edge';

export default function ContentCalendarPage() {
  return <UpgradeGate><ContentCalendarClient /></UpgradeGate>;
}
