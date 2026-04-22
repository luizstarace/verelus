export default function TermsPage() {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      <nav className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto border-b border-brand-border">
        <a href="/" className="text-xl font-bold tracking-tight">VERELUS</a>
      </nav>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">Termos de Uso</h1>
        <div className="prose prose-sm max-w-none text-brand-muted space-y-6">
          <p><strong>Última atualização:</strong> 13 de abril de 2026</p>

          <h2 className="text-xl font-semibold text-brand-text mt-8">1. Aceitação dos Termos</h2>
          <p>Ao acessar e utilizar a plataforma Verelus (&quot;Serviço&quot;), você concorda com estes Termos de Uso. Se não concordar, não utilize o Serviço.</p>

          <h2 className="text-xl font-semibold text-brand-text mt-8">2. Descrição do Serviço</h2>
          <p>Verelus é uma plataforma de inteligência musical com IA que oferece ferramentas para músicos independentes, incluindo geração de conteúdo com IA, gestão financeira, planejamento de turnês, e newsletter.</p>

          <h2 className="text-xl font-semibold text-brand-text mt-8">3. Contas e Assinaturas</h2>
          <p>Para acessar funcionalidades premium, você deve criar uma conta e adquirir um plano de assinatura. Você é responsável por manter a segurança da sua conta e senha.</p>
          <p>As assinaturas são cobradas mensalmente via Stripe. Você pode cancelar a qualquer momento pelo painel do usuário. O cancelamento entra em vigor ao final do período pago.</p>

          <h2 className="text-xl font-semibold text-brand-text mt-8">4. Conteúdo Gerado por IA</h2>
          <p>O conteúdo gerado pela plataforma (press releases, contratos, posts, etc.) é fornecido como sugestão e modelo inicial. A Verelus não se responsabiliza pelo uso direto desse conteúdo sem revisão profissional adequada.</p>
          <p>Contratos gerados por IA não substituem assessoria jurídica. Consulte um advogado antes de assinar documentos legais.</p>

          <h2 className="text-xl font-semibold text-brand-text mt-8">5. Propriedade Intelectual</h2>
          <p>O conteúdo gerado pela IA a partir dos seus dados pertence a você. A plataforma, design, código e marca Verelus são propriedade da empresa.</p>

          <h2 className="text-xl font-semibold text-brand-text mt-8">6. Uso Aceitável</h2>
          <p>Você concorda em não utilizar o Serviço para fins ilegais, spam, ou gerar conteúdo que viole direitos de terceiros.</p>

          <h2 className="text-xl font-semibold text-brand-text mt-8">7. Limitação de Responsabilidade</h2>
          <p>O Serviço é fornecido &quot;como está&quot;. A Verelus não garante disponibilidade ininterrupta, resultados específicos, ou adequação para fins particulares.</p>

          <h2 className="text-xl font-semibold text-brand-text mt-8">8. Alterações nos Termos</h2>
          <p>Podemos atualizar estes termos a qualquer momento. Alterações significativas serão comunicadas por email.</p>

          <h2 className="text-xl font-semibold text-brand-text mt-8">9. Contato</h2>
          <p>Para dúvidas sobre estes termos, entre em contato: <a href="mailto:contato@verelus.com" className="text-brand-trust">contato@verelus.com</a></p>
        </div>
      </div>
    </div>
  );
}
