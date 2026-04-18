export const runtime = 'edge';

import ProposalDetail from './ProposalDetail';

export default function ProposalDetailPage({ params }: { params: { id: string } }) {
  return <ProposalDetail id={params.id} />;
}
