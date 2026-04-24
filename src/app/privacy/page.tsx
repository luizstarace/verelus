export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      <nav className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto border-b border-brand-border">
        <a href="/" className="text-xl font-bold tracking-tight">VERELUS</a>
      </nav>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">Política de Privacidade</h1>
        <div className="prose prose-sm max-w-none text-brand-muted space-y-6">
          <p><strong>Última atualização:</strong> 23 de abril de 2026</p>

          <p>A Verelus é a controladora desta plataforma e opera o produto Attendly — um atendente de IA para pequenos e médios negócios brasileiros via WhatsApp e widget de chat. Esta política descreve como tratamos dados pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018).</p>

          <h2 className="text-xl font-semibold text-brand-text mt-8">1. Dados que Coletamos</h2>
          <p><strong>Dados do titular da conta (cliente Verelus):</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Dados de conta: email, nome, senha (armazenada como hash criptográfico)</li>
            <li>Dados do negócio: nome, categoria, telefone, endereço, serviços, horários, FAQ</li>
            <li>Dados de pagamento: processados pelo Stripe — não armazenamos dados de cartão</li>
            <li>Dados de uso: páginas visitadas, funcionalidades utilizadas, logs técnicos</li>
          </ul>
          <p><strong>Dados de clientes finais do negócio (atendidos pela IA):</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Número de WhatsApp ou identificador do widget</li>
            <li>Nome (quando informado)</li>
            <li>Conteúdo das mensagens trocadas com o atendente</li>
            <li>Áudios gerados pela IA (quando habilitado)</li>
          </ul>
          <p>Nesta camada, o titular da conta (cliente Verelus) é o controlador dos dados dos seus próprios clientes. A Verelus atua como operadora (processadora), tratando esses dados apenas para executar o serviço contratado.</p>

          <h2 className="text-xl font-semibold text-brand-text mt-8">2. Como Usamos os Dados</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Operar o atendente de IA (gerar respostas, transferir para humano quando configurado)</li>
            <li>Personalizar as respostas com base no contexto do negócio configurado</li>
            <li>Enviar notificações sobre conversas e transferências para o titular da conta</li>
            <li>Processar pagamentos e gerenciar assinaturas</li>
            <li>Aplicar limites de uso, detectar abuso e manter a segurança da plataforma</li>
            <li>Melhorar o serviço (análises agregadas e anonimizadas)</li>
          </ul>

          <h2 className="text-xl font-semibold text-brand-text mt-8">3. Compartilhamento de Dados</h2>
          <p>Não vendemos dados. Compartilhamos apenas com operadores necessários à prestação do serviço:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Supabase:</strong> infraestrutura de banco de dados e autenticação</li>
            <li><strong>Cloudflare:</strong> hospedagem, CDN e proteção contra ataques</li>
            <li><strong>Anthropic (Claude):</strong> geração de respostas da IA. As mensagens enviadas à Anthropic não são utilizadas para treinar modelos.</li>
            <li><strong>ElevenLabs:</strong> síntese de voz (quando a geração de áudio é habilitada)</li>
            <li><strong>Stripe:</strong> processamento de pagamentos</li>
            <li><strong>Resend:</strong> envio de emails transacionais</li>
          </ul>
          <p>A integração com o WhatsApp é feita via servidor próprio (Evolution API), hospedado em infraestrutura contratada pela Verelus. Nenhum dado é enviado a intermediários não listados aqui.</p>

          <h2 className="text-xl font-semibold text-brand-text mt-8">4. Base Legal</h2>
          <p>Tratamos os dados com base em: (i) execução de contrato, para operar o serviço contratado pelo titular da conta; (ii) legítimo interesse, para segurança, prevenção a fraudes e melhoria do serviço; (iii) cumprimento de obrigação legal, quando aplicável; (iv) consentimento, quando explicitamente solicitado.</p>

          <h2 className="text-xl font-semibold text-brand-text mt-8">5. Retenção</h2>
          <p>Dados da conta e do negócio são mantidos enquanto a conta estiver ativa. Após encerramento, os dados são excluídos em até 30 dias, exceto quando houver obrigação legal de retenção.</p>
          <p>Logs técnicos são retidos por até 90 dias para fins de segurança e auditoria.</p>
          <p>Conversas e áudios são retidos enquanto a conta do titular estiver ativa ou até solicitação de exclusão.</p>

          <h2 className="text-xl font-semibold text-brand-text mt-8">6. Segurança</h2>
          <p>Utilizamos criptografia em trânsito (HTTPS/TLS) e em repouso, autenticação via Supabase Auth, controles de acesso por papel (RLS) e monitoramento contínuo. Apesar disso, nenhum sistema é 100% imune — incidentes relevantes serão comunicados conforme determina a LGPD.</p>

          <h2 className="text-xl font-semibold text-brand-text mt-8">7. Direitos do Titular (LGPD)</h2>
          <p>Você tem direito a: acesso, correção, anonimização, bloqueio, eliminação, portabilidade, informação sobre compartilhamento e revogação de consentimento.</p>
          <p>Titulares de conta Verelus podem exercer esses direitos diretamente em <a href="mailto:contato@verelus.com" className="text-brand-trust">contato@verelus.com</a>.</p>
          <p>Clientes finais (pessoas atendidas pela IA) devem direcionar pedidos ao negócio com o qual interagiram — esse negócio é o controlador dos dados. A Verelus, como operadora, atenderá a solicitação via o titular da conta correspondente.</p>

          <h2 className="text-xl font-semibold text-brand-text mt-8">8. Cookies</h2>
          <p>Usamos apenas cookies essenciais para autenticação e sessão. Não utilizamos cookies de rastreamento publicitário de terceiros.</p>

          <h2 className="text-xl font-semibold text-brand-text mt-8">9. Transferência Internacional</h2>
          <p>Alguns operadores (Anthropic, Stripe, Cloudflare, ElevenLabs, Resend, Supabase) podem processar dados fora do Brasil. Nestas situações, exigimos garantias adequadas nos termos do Art. 33 da LGPD.</p>

          <h2 className="text-xl font-semibold text-brand-text mt-8">10. Alterações</h2>
          <p>Podemos atualizar esta política. Mudanças significativas serão comunicadas por email ao titular da conta com antecedência razoável.</p>

          <h2 className="text-xl font-semibold text-brand-text mt-8">11. Encarregado e Contato</h2>
          <p>Para exercer direitos, tirar dúvidas ou reportar incidentes: <a href="mailto:contato@verelus.com" className="text-brand-trust">contato@verelus.com</a>.</p>
        </div>
      </div>
    </div>
  );
}
