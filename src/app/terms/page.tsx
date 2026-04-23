export default function TermsPage() {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      <nav className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto border-b border-brand-border">
        <a href="/" className="text-xl font-bold tracking-tight">VERELUS</a>
      </nav>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">Termos de Uso</h1>
        <div className="prose prose-sm max-w-none text-brand-muted space-y-6">
          <p><strong>Última atualização:</strong> 23 de abril de 2026</p>

          <h2 className="text-xl font-semibold text-brand-text mt-8">1. Aceitação</h2>
          <p>Ao criar uma conta ou utilizar a plataforma Verelus (&quot;Serviço&quot;), em especial o produto Attendly, você concorda com estes Termos. Se não concordar, não utilize o Serviço.</p>

          <h2 className="text-xl font-semibold text-brand-text mt-8">2. Descrição do Serviço</h2>
          <p>Attendly é um atendente virtual de IA para pequenos e médios negócios, operando via widget de chat embutido em sites e via WhatsApp. O Serviço gera respostas automatizadas com base em configurações fornecidas pelo titular da conta (nome do negócio, serviços, horário, FAQ, contexto).</p>

          <h2 className="text-xl font-semibold text-brand-text mt-8">3. Contas e Assinaturas</h2>
          <p>Para acessar o Serviço é necessário criar uma conta. O titular é responsável por manter a confidencialidade de credenciais e por todas as atividades realizadas com sua conta.</p>
          <p>O Attendly oferece um período de teste gratuito de 7 dias, sem necessidade de cartão. Após o teste, a continuidade do serviço requer assinatura de um plano (Starter, Pro ou Business), com cobrança mensal ou anual via Stripe. Uso acima do limite do plano pode gerar cobrança por excedente, conforme divulgado na página de planos.</p>
          <p>Assinaturas podem ser canceladas a qualquer momento pelo painel. O cancelamento encerra a cobrança no próximo ciclo, e o acesso permanece até o fim do período já pago.</p>

          <h2 className="text-xl font-semibold text-brand-text mt-8">4. Responsabilidade do Titular pelos Dados dos Clientes Finais</h2>
          <p>Ao usar o Attendly para atender clientes via WhatsApp ou widget, o titular da conta é o controlador dos dados dos seus próprios clientes (números, nomes, conteúdo das conversas). A Verelus é operadora (processadora) e trata esses dados apenas para executar o Serviço.</p>
          <p>É responsabilidade do titular: (i) informar seus clientes de que o atendimento inicial é feito por IA; (ii) cumprir com a LGPD e demais leis aplicáveis ao seu negócio; (iii) obter consentimento dos clientes quando a legislação exigir; (iv) garantir que o uso do WhatsApp esteja em conformidade com os Termos do WhatsApp.</p>

          <h2 className="text-xl font-semibold text-brand-text mt-8">5. Conteúdo Gerado por IA</h2>
          <p>As respostas são geradas automaticamente por modelos de IA (Claude da Anthropic) com base no contexto configurado. Podem conter imprecisões. A Verelus não se responsabiliza por decisões tomadas exclusivamente com base nas respostas da IA, incluindo informações de preço, disponibilidade, promessas ou acordos comerciais.</p>
          <p>O titular deve revisar periodicamente o contexto configurado, testar o atendente, e configurar regras de transferência para humano em casos sensíveis.</p>

          <h2 className="text-xl font-semibold text-brand-text mt-8">6. Integração com WhatsApp</h2>
          <p>A integração com o WhatsApp é feita via servidor Evolution API (implementação não oficial baseada em Baileys). O uso pode estar sujeito a limitações, bloqueios ou banimentos impostos pelo WhatsApp. A Verelus não garante disponibilidade contínua da integração e não se responsabiliza por interrupções decorrentes de alterações do WhatsApp.</p>
          <p>Recomendamos o uso de um número dedicado (não pessoal) e a observância das políticas do WhatsApp.</p>

          <h2 className="text-xl font-semibold text-brand-text mt-8">7. Uso Aceitável</h2>
          <p>É proibido usar o Serviço para: (i) enviar mensagens não solicitadas (spam); (ii) enganar clientes quanto à natureza automatizada do atendimento; (iii) atividades ilegais, fraude ou violação de direitos de terceiros; (iv) engenharia reversa da plataforma; (v) acesso não autorizado a dados de outros usuários. Violações podem resultar em suspensão imediata da conta sem reembolso.</p>

          <h2 className="text-xl font-semibold text-brand-text mt-8">8. Propriedade Intelectual</h2>
          <p>A plataforma, marca Verelus, marca Attendly, código, design e documentação são de propriedade da Verelus. Dados configurados pelo titular (serviços, FAQ, contexto) e o histórico de conversas com seus clientes pertencem ao titular da conta.</p>

          <h2 className="text-xl font-semibold text-brand-text mt-8">9. Limitação de Responsabilidade</h2>
          <p>O Serviço é fornecido &quot;como está&quot;. A Verelus não garante disponibilidade ininterrupta, ausência de erros ou adequação a finalidades específicas. A responsabilidade máxima da Verelus fica limitada ao valor efetivamente pago pelo titular nos 12 meses anteriores ao evento que deu origem à reclamação.</p>

          <h2 className="text-xl font-semibold text-brand-text mt-8">10. Encerramento</h2>
          <p>Podemos suspender ou encerrar contas que violem estes Termos. O titular pode encerrar sua conta a qualquer momento, com exclusão de dados conforme descrito na Política de Privacidade.</p>

          <h2 className="text-xl font-semibold text-brand-text mt-8">11. Alterações</h2>
          <p>Podemos atualizar estes Termos. Mudanças significativas serão comunicadas por email com antecedência razoável. O uso continuado após a alteração implica concordância.</p>

          <h2 className="text-xl font-semibold text-brand-text mt-8">12. Foro e Legislação</h2>
          <p>Estes Termos são regidos pela legislação brasileira. Fica eleito o foro da Comarca de São Paulo - SP para dirimir qualquer controvérsia, salvo disposição legal em contrário.</p>

          <h2 className="text-xl font-semibold text-brand-text mt-8">13. Contato</h2>
          <p>Dúvidas sobre estes Termos: <a href="mailto:contato@verelus.com" className="text-brand-trust">contato@verelus.com</a></p>
        </div>
      </div>
    </div>
  );
}
