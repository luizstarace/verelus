'use client';

import { useUserTier } from '@/lib/use-user-tier';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  feature?: string;
}

export function UpgradeModal({ open, onClose, feature }: UpgradeModalProps) {
  const { tier } = useUserTier();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#12151e] border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white transition text-xl"
        >
          &times;
        </button>

        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-[#00f5a0]/10 flex items-center justify-center">
            <span className="text-2xl">&#x2728;</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Upgrade para continuar
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-6">
            {feature
              ? `Para usar "${feature}", voce precisa de um plano superior.`
              : 'Voce atingiu o limite do plano gratuito.'}
            {' '}Faca upgrade para desbloquear geracao ilimitada com IA e todos os recursos.
          </p>

          <div className="space-y-3">
            <a
              href="/#pricing"
              className="block w-full py-3 bg-gradient-to-r from-[#00f5a0] to-[#00d9f5] text-black font-bold rounded-xl hover:shadow-lg hover:shadow-[#00f5a0]/25 transition text-sm"
            >
              Ver planos e fazer upgrade
            </a>
            <button
              onClick={onClose}
              className="block w-full py-3 border border-white/10 text-white/50 rounded-xl hover:text-white hover:border-white/20 transition text-sm"
            >
              Continuar no plano {tier}
            </button>
          </div>

          <p className="text-zinc-600 text-xs mt-5">
            Plano atual: <span className="text-zinc-400 font-semibold uppercase">{tier}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
