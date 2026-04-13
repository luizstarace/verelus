import { useState } from 'react';
import { useUserTier } from '@/lib/use-user-tier';

const FREE_AI_LIMIT = 3;

export function useAiLimit() {
  const { tier } = useUserTier();
  const [generationCount, setGenerationCount] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const canGenerate = tier !== 'free' || generationCount < FREE_AI_LIMIT;

  function tryGenerate(onAllowed: () => void) {
    if (tier !== 'free') {
      onAllowed();
      return;
    }
    if (generationCount >= FREE_AI_LIMIT) {
      setShowUpgrade(true);
      return;
    }
    setGenerationCount((c) => c + 1);
    onAllowed();
  }

  return {
    canGenerate,
    tryGenerate,
    showUpgrade,
    closeUpgrade: () => setShowUpgrade(false),
    remaining: tier === 'free' ? Math.max(0, FREE_AI_LIMIT - generationCount) : null,
  };
}
