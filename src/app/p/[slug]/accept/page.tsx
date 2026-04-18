import { AcceptForm } from './AcceptForm';

export const runtime = 'edge';

export default function AcceptPage({ params }: { params: { slug: string } }) {
  return <AcceptForm slug={params.slug} />;
}
