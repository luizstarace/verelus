export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-brand-dark text-white">
      <nav className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto border-b border-white/5">
        <a href="/" className="text-xl font-bold font-display tracking-wider">VERELUS</a>
      </nav>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">Política de Privacidade</h1>
        <div className="prose prose-invert prose-sm max-w-none text-zinc-300 space-y-6">
          <p><strong>Última atualização:</strong> 13 de abril de 2026</p>

          <h2 className="text-xl font-semibold text-white mt-8">1. Dados que Coletamos</h2>
          <p>Coletamos os seguintes dados quando você utiliza a Verelus:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Dados de conta:</strong> email, nome, senha (hash criptográfico)</li>
            <li><strong>Perfil do artista:</strong> nome artístico, gênero musical, bio, cidade, redes sociais</li>
            <li><strong>Dados financeiros:</strong> transações registradas por você na plataforma (não armazenamos dados de cartão de crédito — isso é feito pelo Stripe)</li>
            <li><strong>Conteúdo gerado:</strong> press releases, contratos, posts e outros conteúdos criados na plataforma</li>
            <li><strong>Dados de uso:</strong> páginas visitadas, funcionalidades utilizadas</li>
          </ul>

          <h2 className="text-xl font-semibold text-white mt-8">2. Como Usamos seus Dados</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Fornecer e melhorar o Serviço</li>
            <li>Personalizar o conteúdo gerado pela IA com base no seu perfil</li>
            <li>Processar pagamentos via Stripe</li>
            <li>Enviar a newsletter (se inscrito) e comunicações sobre o serviço</li>
            <li>Garantir a segurança da plataforma</li>
          </ul>

          <h2 className="text-xl font-semibold text-white mt-8">3. Compartilhamento de Dados</h2>
          <p>Não vendemos seus dados. Compartilhamos dados apenas com:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Stripe:</strong> para processamento de pagamentos</li>
            <li><strong>Supabase:</strong> para armazenamento de dados (infraestrutura)</li>
            <li><strong>Anthropic (Claude AI):</strong> para geração de conteúdo (os dados enviados à IA não são usados para treinamento)</li>
            <li><strong>Resend:</strong> para envio de emails</li>
          </ul>

          <h2 className="text-xl font-semibold text-white mt-8">4. Segurança</h2>
          <p>Utilizamos criptografia em trânsito (HTTPS), autenticação segura via Supabase Auth, e nunca armazenamos senhas em texto puro.</p>

          <h2 className="text-xl font-semibold text-white mt-8">5. Seus Direitos (LGPD)</h2>
          <p>De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Acessar seus dados pessoais</li>
            <li>Corrigir dados incorretos</li>
            <li>Solicitar a exclusão dos seus dados</li>
            <li>Revogar consentimento para o uso dos dados</li>
            <li>Solicitar a portabilidade dos seus dados</li>
          </ul>
          <p>Para exercer esses direitos, envie um email para <a href="mailto:privacidade@verelus.com" className="text-brand-green">privacidade@verelus.com</a>.</p>

          <h2 className="text-xl font-semibold text-white mt-8">6. Cookies</h2>
          <p>Utilizamos cookies essenciais para autenticação e sessão. Não utilizamos cookies de rastreamento de terceiros.</p>

          <h2 className="text-xl font-semibold text-white mt-8">7. Retenção de Dados</h2>
          <p>Seus dados são mantidos enquanto sua conta estiver ativa. Após exclusão da conta, os dados são removidos em até 30 dias.</p>

          <h2 className="text-xl font-semibold text-white mt-8">8. Contato</h2>
          <p>Para questões de privacidade: <a href="mailto:privacidade@verelus.com" className="text-brand-green">privacidade@verelus.com</a></p>
        </div>
      </div>
    </div>
  );
}
