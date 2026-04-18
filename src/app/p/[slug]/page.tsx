import { PublicProposal } from './PublicProposal';

export const runtime = 'edge';

export default function ProposalPage({ params }: { params: { slug: string } }) {
  return <PublicProposal slug={params.slug} />;
}
