export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#080a0f] text-white">
      <nav className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto border-b border-white/5">
        <a href="/" className="text-xl font-bold font-display tracking-wider">VERELUS</a>
      </nav>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">Termos de Uso</h1>
        <div className="prose prose-invert prose-sm max-w-none text-zinc-300 space-y-6">
          <p><strong>Ultima atualizacao:</strong> 13 de abril de 2026</p>

          <h2 className="text-xl font-semibold text-white mt-8">1. Aceitacao dos Termos</h2>
          <p>Ao acessar e utilizar a plataforma Verelus (&quot;Servico&quot;), voce concorda com estes Termos de Uso. Se nao concordar, nao utilize o Servico.</p>

          <h2 className="text-xl font-semibold text-white mt-8">2. Descricao do Servico</h2>
          <p>Verelus e uma plataforma de inteligencia musical com IA que oferece ferramentas para musicos independentes, incluindo geracao de conteudo com IA, gestao financeira, planejamento de turnes, e newsletter.</p>

          <h2 className="text-xl font-semibold text-white mt-8">3. Contas e Assinaturas</h2>
          <p>Para acessar funcionalidades premium, voce deve criar uma conta e adquirir um plano de assinatura. Voce e responsavel por manter a seguranca da sua conta e senha.</p>
          <p>As assinaturas sao cobradas mensalmente via Stripe. Voce pode cancelar a qualquer momento pelo painel do usuario. O cancelamento entra em vigor ao final do periodo pago.</p>

          <h2 className="text-xl font-semibold text-white mt-8">4. Conteudo Gerado por IA</h2>
          <p>O conteudo gerado pela plataforma (press releases, contratos, posts, etc.) e fornecido como sugestao e modelo inicial. A Verelus nao se responsabiliza pelo uso direto desse conteudo sem revisao profissional adequada.</p>
          <p>Contratos gerados por IA nao substituem assessoria juridica. Consulte um advogado antes de assinar documentos legais.</p>

          <h2 className="text-xl font-semibold text-white mt-8">5. Propriedade Intelectual</h2>
          <p>O conteudo gerado pela IA a partir dos seus dados pertence a voce. A plataforma, design, codigo e marca Verelus sao propriedade da empresa.</p>

          <h2 className="text-xl font-semibold text-white mt-8">6. Uso Aceitavel</h2>
          <p>Voce concorda em nao utilizar o Servico para fins ilegais, spam, ou gerar conteudo que viole direitos de terceiros.</p>

          <h2 className="text-xl font-semibold text-white mt-8">7. Limitacao de Responsabilidade</h2>
          <p>O Servico e fornecido &quot;como esta&quot;. A Verelus nao garante disponibilidade ininterrupta, resultados especificos, ou adequacao para fins particulares.</p>

          <h2 className="text-xl font-semibold text-white mt-8">8. Alteracoes nos Termos</h2>
          <p>Podemos atualizar estes termos a qualquer momento. Alteracoes significativas serao comunicadas por email.</p>

          <h2 className="text-xl font-semibold text-white mt-8">9. Contato</h2>
          <p>Para duvidas sobre estes termos, entre em contato: <a href="mailto:contato@verelus.com" className="text-[#00f5a0]">contato@verelus.com</a></p>
        </div>
      </div>
    </div>
  );
}
