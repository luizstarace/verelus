'use client';

import { useUserTier, isPro } from '@/lib/use-user-tier';

interface UpgradeGateProps {
  children: React.ReactNode;
}

export function UpgradeGate({ children }: UpgradeGateProps) {
  const { tier, loading } = useUserTier();

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isPro(tier)) {
    return <>{children}</>;
  }

  return (
    <div className="p-8 flex items-center justify-center min-h-[60vh]">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-brand-green/10 flex items-center justify-center">
          <span className="text-3xl">🔒</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">
          Recurso do plano Pro
        </h2>
        <p className="text-brand-muted mb-6 text-sm leading-relaxed">
          Assine o Pro por R$29/mês para desbloquear uso ilimitado de todas as ferramentas.
        </p>
        <div className="flex gap-3 justify-center">
          <a
            href="/#pricing"
            className="px-6 py-3 bg-brand-green text-black font-bold rounded-lg hover:brightness-110 transition text-sm"
          >
            Assinar Pro — R$29/mês
          </a>
          <a
            href="/dashboard"
            className="px-6 py-3 border border-white/10 text-white/60 rounded-lg hover:text-white hover:border-white/20 transition text-sm"
          >
            Voltar ao painel
          </a>
        </div>
        <p className="text-brand-muted/50 text-xs mt-6">
          Seu plano atual: <span className="text-white/60 font-semibold uppercase">{tier}</span>
        </p>
      </div>
    </div>
  );
}
