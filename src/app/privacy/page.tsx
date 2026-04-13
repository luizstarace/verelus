export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#080a0f] text-white">
      <nav className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto border-b border-white/5">
        <a href="/" className="text-xl font-bold font-display tracking-wider">VERELUS</a>
      </nav>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">Politica de Privacidade</h1>
        <div className="prose prose-invert prose-sm max-w-none text-zinc-300 space-y-6">
          <p><strong>Ultima atualizacao:</strong> 13 de abril de 2026</p>

          <h2 className="text-xl font-semibold text-white mt-8">1. Dados que Coletamos</h2>
          <p>Coletamos os seguintes dados quando voce utiliza a Verelus:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Dados de conta:</strong> email, nome, senha (hash criptografico)</li>
            <li><strong>Perfil do artista:</strong> nome artistico, genero musical, bio, cidade, redes sociais</li>
            <li><strong>Dados financeiros:</strong> transacoes registradas por voce na plataforma (nao armazenamos dados de cartao de credito — isso e feito pelo Stripe)</li>
            <li><strong>Conteudo gerado:</strong> press releases, contratos, posts e outros conteudos criados na plataforma</li>
            <li><strong>Dados de uso:</strong> paginas visitadas, funcionalidades utilizadas</li>
          </ul>

          <h2 className="text-xl font-semibold text-white mt-8">2. Como Usamos seus Dados</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Fornecer e melhorar o Servico</li>
            <li>Personalizar o conteudo gerado pela IA com base no seu perfil</li>
            <li>Processar pagamentos via Stripe</li>
            <li>Enviar a newsletter (se inscrito) e comunicacoes sobre o servico</li>
            <li>Garantir a seguranca da plataforma</li>
          </ul>

          <h2 className="text-xl font-semibold text-white mt-8">3. Compartilhamento de Dados</h2>
          <p>Nao vendemos seus dados. Compartilhamos dados apenas com:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Stripe:</strong> para processamento de pagamentos</li>
            <li><strong>Supabase:</strong> para armazenamento de dados (infraestrutura)</li>
            <li><strong>Anthropic (Claude AI):</strong> para geracao de conteudo (os dados enviados a IA nao sao usados para treinamento)</li>
            <li><strong>Resend:</strong> para envio de emails</li>
          </ul>

          <h2 className="text-xl font-semibold text-white mt-8">4. Seguranca</h2>
          <p>Utilizamos criptografia em transito (HTTPS), autenticacao segura via Supabase Auth, e nunca armazenamos senhas em texto puro.</p>

          <h2 className="text-xl font-semibold text-white mt-8">5. Seus Direitos (LGPD)</h2>
          <p>De acordo com a Lei Geral de Protecao de Dados (LGPD), voce tem direito a:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Acessar seus dados pessoais</li>
            <li>Corrigir dados incorretos</li>
            <li>Solicitar a exclusao dos seus dados</li>
            <li>Revogar consentimento para o uso dos dados</li>
            <li>Solicitar a portabilidade dos seus dados</li>
          </ul>
          <p>Para exercer esses direitos, envie um email para <a href="mailto:privacidade@verelus.com" className="text-[#00f5a0]">privacidade@verelus.com</a>.</p>

          <h2 className="text-xl font-semibold text-white mt-8">6. Cookies</h2>
          <p>Utilizamos cookies essenciais para autenticacao e sessao. Nao utilizamos cookies de rastreamento de terceiros.</p>

          <h2 className="text-xl font-semibold text-white mt-8">7. Retencao de Dados</h2>
          <p>Seus dados sao mantidos enquanto sua conta estiver ativa. Apos exclusao da conta, os dados sao removidos em ate 30 dias.</p>

          <h2 className="text-xl font-semibold text-white mt-8">8. Contato</h2>
          <p>Para questoes de privacidade: <a href="mailto:privacidade@verelus.com" className="text-[#00f5a0]">privacidade@verelus.com</a></p>
        </div>
      </div>
    </div>
  );
}
