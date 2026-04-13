'use client';

import { useUserTier, canAccess } from '@/lib/use-user-tier';
import type { PlanTier } from '@/lib/use-user-tier';

interface UpgradeGateProps {
  module: string;
  children: React.ReactNode;
}

export function UpgradeGate({ module, children }: UpgradeGateProps) {
  const { tier, loading } = useUserTier();

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-[#00f5a0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (canAccess(tier, module)) {
    return <>{children}</>;
  }

  const required = module === 'tours' ? 'business' : 'pro';

  return (
    <div className="p-8 flex items-center justify-center min-h-[60vh]">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#00f5a0]/10 flex items-center justify-center">
          <span className="text-3xl">🔒</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">
          Recurso do plano {required === 'business' ? 'Business' : 'Pro'}
        </h2>
        <p className="text-zinc-400 mb-6 text-sm leading-relaxed">
          Faca upgrade para o plano {required === 'business' ? 'Business' : 'Pro'} para desbloquear
          este recurso e ter acesso a todas as ferramentas de inteligencia musical.
        </p>
        <div className="flex gap-3 justify-center">
          <a
            href="/#pricing"
            className="px-6 py-3 bg-[#00f5a0] text-black font-bold rounded-lg hover:bg-[#00f5a0]/80 transition text-sm"
          >
            Ver planos
          </a>
          <a
            href="/dashboard"
            className="px-6 py-3 border border-white/10 text-white/60 rounded-lg hover:text-white hover:border-white/20 transition text-sm"
          >
            Voltar ao painel
          </a>
        </div>
        <p className="text-zinc-600 text-xs mt-6">
          Seu plano atual: <span className="text-zinc-400 font-semibold uppercase">{tier}</span>
        </p>
      </div>
    </div>
  );
}
