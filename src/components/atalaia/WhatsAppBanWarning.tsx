'use client';

import { useState } from 'react';

export default function WhatsAppBanWarning() {
  const [showWhy, setShowWhy] = useState(false);

  return (
    <>
      <div className="border border-amber-300 bg-amber-50 rounded-lg p-4 text-sm text-amber-900 space-y-3">
        <div className="flex gap-2">
          <span aria-hidden className="text-lg leading-none">⚠️</span>
          <div className="space-y-2">
            <p className="font-semibold">Risco de banimento do WhatsApp</p>
            <p>
              O WhatsApp pode banir números conectados via API se detectar comportamento
              suspeito — em minutos, sem aviso. Isso é mais comum em chips novos, pessoais
              ou que migraram de outro app.
            </p>
            <div>
              <p className="font-medium mb-1">Recomendado:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Use um chip <strong>dedicado ao negócio</strong>, com 30+ dias de uso normal</li>
                <li>Que tenha foto de perfil, faça e receba ligações, mande mensagens reais</li>
                <li>Que <strong>não</strong> tenha sido usado pra outras automações antes</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">Não use:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Seu chip pessoal</li>
                <li>Chip recém-comprado (sem histórico)</li>
                <li>Número que vai sair de outro app no momento</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setShowWhy(true)}
              className="text-amber-900 underline hover:no-underline"
            >
              Por que isso acontece?
            </button>
          </div>
        </div>
      </div>

      {showWhy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowWhy(false)} />
          <div className="relative bg-white border border-brand-border rounded-2xl p-6 max-w-lg w-full shadow-lg space-y-3 text-sm text-brand-text">
            <h3 className="text-lg font-bold">Por que o WhatsApp pode banir?</h3>
            <p>
              O Atalaia conecta no seu WhatsApp via uma biblioteca chamada <strong>Baileys</strong>,
              que simula o WhatsApp Web. Funciona muito bem na maioria dos casos, mas o WhatsApp
              monitora padrões de uso pra detectar automação.
            </p>
            <p>
              Chips novos, sem histórico de uso humano, ou que respondem mensagens sem nunca terem
              sido usados antes, são bandeira vermelha. Chips estabelecidos (30+ dias, com foto,
              ligações, contatos salvos) raramente são banidos.
            </p>
            <p>
              <strong>No futuro</strong>, vamos oferecer integração com o <strong>WhatsApp Business
              Cloud API</strong> oficial — mais caro e burocrático (precisa de CNPJ verificado e
              templates aprovados pela Meta), mas com risco zero de ban.
            </p>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowWhy(false)}
                className="px-4 py-2 rounded-lg bg-brand-trust text-white text-sm font-medium hover:bg-brand-primary transition"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
