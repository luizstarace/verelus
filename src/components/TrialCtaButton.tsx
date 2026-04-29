'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { trackMeta } from '@/lib/analytics/meta';

type Props = {
  children: ReactNode;
  className?: string;
  source?: string;
  href?: string;
};

export default function TrialCtaButton({
  children,
  className,
  source,
  href = '/login',
}: Props) {
  const handleClick = () => {
    trackMeta('Lead', {
      content_name: 'trial',
      content_category: source ?? 'cta',
    });
  };

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
