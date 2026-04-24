export const runtime = 'edge';

export const metadata = {
  title: 'Manual do Attendly — Verelus',
  description:
    'Guia passo-a-passo para configurar e usar o Attendly: atendente de IA para PMEs via WhatsApp e widget de chat.',
};

export default function AjudaPage() {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      <nav className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto border-b border-brand-border">
        <a href="/" className="text-xl font-bold tracking-tight">VERELUS</a>
        <div className="flex items-center gap-4 text-sm">
          <a href="/dashboard/attendly" className="text-brand-muted hover:text-brand-text transition">Dashboard</a>
          <a href="/login" className="text-brand-muted hover:text-brand-text transition">Entrar</a>
        </div>
      </nav>

      <article className="max-w-4xl mx-auto px-6 py-12">
        <header className="mb-10">
          <p className="text-xs uppercase tracking-wider text-brand-muted mb-2">Manual</p>
          <h1 className="text-3xl font-bold mb-3">Manual do Attendly</h1>
          <p className="text-brand-muted">
            Guia passo-a-passo para configurar seu atendente de IA, conectar WhatsApp e
            atender clientes 24 horas por dia. Estimativa: 15 minutos para deixar tudo funcionando.
          </p>
        </header>

        <nav className="mb-12 p-5 bg-brand-surface rounded-lg border border-brand-border">
          <h2 className="text-xs font-semibold text-brand-muted uppercase tracking-wide mb-3">
            Sumário
          </h2>
          <ol className="space-y-1.5 text-sm">
            <li><a href="#o-que-e" className="text-brand-trust hover:underline">1. O que é o Attendly</a></li>
            <li><a href="#cadastro" className="text-brand-trust hover:underline">2. Criar conta e teste grátis</a></li>
            <li><a href="#setup" className="text-brand-trust hover:underline">3. Configurar seu negócio (Setup)</a></li>
            <li><a href="#widget" className="text-brand-trust hover:underline">4. Instalar o widget no seu site</a></li>
            <li><a href="#whatsapp" className="text-brand-trust hover:underline">5. Conectar o WhatsApp</a></li>
            <li><a href="#inbox" className="text-brand-trust hover:underline">6. Acompanhar conversas (Inbox)</a></li>
            <li><a href="#voz" className="text-brand-trust hover:underline">7. Configurar a voz (opcional)</a></li>
            <li><a href="#notificacoes" className="text-brand-trust hover:underline">8. Notificações para você</a></li>
            <li><a href="#plano" className="text-brand-trust hover:underline">9. Plano, uso e cobrança</a></li>
            <li><a href="#logs" className="text-brand-trust hover:underline">10. Logs e diagnóstico</a></li>
            <li><a href="#boas-praticas" className="text-brand-trust hover:underline">11. Boas práticas</a></li>
            <li><a href="#suporte" className="text-brand-trust hover:underline">12. Suporte</a></li>
          </ol>
        </nav>

        <div className="prose prose-sm max-w-none text-brand-muted space-y-10">

          <section id="o-que-e">
            <h2 className="text-xl font-semibold text-brand-text mb-3">1. O que é o Attendly</h2>
            <p>
              O Attendly é um atendente virtual de IA que responde seus clientes
              automaticamente em dois canais: um <strong>chat embutido no seu site</strong> (widget)
              e o <strong>WhatsApp</strong>. Ele conhece seu negócio (serviços, preços, horários,
              perguntas frequentes) e responde 24h por dia em português, transferindo
              para uma pessoa humana quando o assunto é sensível.
            </p>
            <p>
              Você configura o atendente uma vez, conecta seu WhatsApp e/ou cola um
              código no seu site, e ele começa a trabalhar.
            </p>
          </section>

          <section id="cadastro">
            <h2 className="text-xl font-semibold text-brand-text mb-3">2. Criar conta e teste grátis</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Acesse <a href="/login" className="text-brand-trust hover:underline">verelus.com/login</a> e clique em <strong>&quot;Criar conta&quot;</strong>.</li>
              <li>Informe seu email e crie uma senha.</li>
              <li>Confirme o email pelo link que enviamos (cheque a caixa de spam se não chegar em 1 minuto).</li>
              <li>Faça login. Você cai no painel do Attendly com 7 dias grátis ativos. <strong>Não pedimos cartão</strong> nessa etapa.</li>
            </ol>
            <p className="mt-3">
              Durante o teste você pode usar todas as funcionalidades do plano Starter,
              incluindo até 500 mensagens. O contador de dias restantes aparece no topo da
              tela <em>Visão Geral</em>.
            </p>
          </section>

          <section id="setup">
            <h2 className="text-xl font-semibold text-brand-text mb-3">3. Configurar seu negócio (Setup)</h2>
            <p>
              No menu lateral, clique em <strong>Configurar</strong>. Você verá um assistente
              em 5 passos. Não precisa preencher tudo de primeira — pode pular qualquer
              etapa e voltar depois.
            </p>
            <h3 className="text-base font-semibold text-brand-text mt-5 mb-2">Passo 1 — Dados do negócio</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Nome:</strong> como você quer que o atendente se apresente.</li>
              <li><strong>Categoria:</strong> ajuda a IA a usar tom adequado (clínica é mais formal, restaurante mais leve).</li>
              <li><strong>Telefone e endereço:</strong> aparecem nas respostas quando o cliente pergunta &quot;onde fica?&quot;.</li>
            </ul>

            <h3 className="text-base font-semibold text-brand-text mt-5 mb-2">Passo 2 — Serviços, horários e FAQ</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Serviços:</strong> nome, preço (em R$), duração e descrição. Quanto mais detalhe, melhor a resposta.</li>
              <li><strong>Horários de funcionamento:</strong> marque os dias da semana e o intervalo. Usado pra avisar &quot;estamos fechados, retornamos amanhã às 8h&quot;.</li>
              <li><strong>FAQ:</strong> perguntas que você responde toda hora — escreva e a IA usa como base. Ex.: &quot;Aceitam Pix?&quot;, &quot;Tem estacionamento?&quot;.</li>
            </ul>

            <h3 className="text-base font-semibold text-brand-text mt-5 mb-2">Passo 3 — Testar o atendente</h3>
            <p>
              Use o chat de teste pra simular uma conversa. Mande mensagens como se fosse
              um cliente. Esse modo de preview <strong>não conta no seu limite</strong> e ajuda a ajustar
              tom e respostas antes de ir ao ar.
            </p>

            <h3 className="text-base font-semibold text-brand-text mt-5 mb-2">Passo 4 — Instalar widget</h3>
            <p>Veja a próxima seção.</p>

            <h3 className="text-base font-semibold text-brand-text mt-5 mb-2">Passo 5 — Conectar WhatsApp</h3>
            <p>Veja a seção &quot;Conectar o WhatsApp&quot; abaixo.</p>
          </section>

          <section id="widget">
            <h2 className="text-xl font-semibold text-brand-text mb-3">4. Instalar o widget no seu site</h2>
            <p>
              O widget é um balão de chat que aparece no canto inferior do seu site.
              Visitantes clicam, conversam, e a IA responde. Pra instalar:
            </p>
            <ol className="list-decimal pl-6 space-y-2 mt-3">
              <li>Vá em <strong>Configurar &gt; Passo 4</strong> ou em <strong>Ajustes &gt; Widget</strong>.</li>
              <li>Personalize cor, posição (canto inferior direito ou esquerdo) e mensagem inicial.</li>
              <li>Clique em <strong>Copiar código</strong>.</li>
              <li>Cole o código no HTML do seu site, antes do fechamento da tag <code>&lt;/body&gt;</code>.</li>
            </ol>
            <p className="mt-3">
              Em sites WordPress, Wix, Webflow ou Shopify normalmente existe um campo
              de &quot;código personalizado&quot; ou &quot;script no rodapé&quot; — é nele que vai. Se você
              não tem acesso ao site, peça pro seu desenvolvedor colar uma única linha.
            </p>
            <p className="mt-3 text-xs text-brand-muted">
              <strong>Dica:</strong> teste o widget abrindo seu site numa aba anônima. Se você estiver
              logado no Verelus na mesma aba, o atendente pode usar modo preview no lugar
              do modo cliente.
            </p>
          </section>

          <section id="whatsapp">
            <h2 className="text-xl font-semibold text-brand-text mb-3">5. Conectar o WhatsApp</h2>
            <p>
              A conexão é feita escaneando um QR Code com o app do WhatsApp do seu celular —
              o mesmo procedimento do WhatsApp Web. Depois de conectado, toda mensagem que
              chegar nesse número é respondida pela IA.
            </p>

            <h3 className="text-base font-semibold text-brand-text mt-5 mb-2">Passo a passo</h3>
            <ol className="list-decimal pl-6 space-y-2">
              <li>No painel, vá em <strong>Ajustes &gt; WhatsApp</strong>.</li>
              <li>Marque a caixa de confirmação <em>&quot;Estou ciente que devo usar um número dedicado&quot;</em>.</li>
              <li>Clique em <strong>Conectar WhatsApp</strong>. Um QR Code aparece em poucos segundos.</li>
              <li>No celular, abra o WhatsApp &gt; <strong>Configurações</strong> &gt; <strong>Aparelhos conectados</strong> &gt; <strong>Conectar um aparelho</strong>.</li>
              <li>Aponte a câmera para o QR Code da tela. Em alguns segundos o status muda para <strong>Conectado</strong>.</li>
              <li>Mande uma mensagem de outro número para o WhatsApp conectado. A IA deve responder em segundos.</li>
            </ol>

            <h3 className="text-base font-semibold text-brand-text mt-5 mb-2">⚠️ Use um número dedicado</h3>
            <p>
              Use um chip ou eSIM <strong>exclusivo</strong> para o atendente, não seu WhatsApp pessoal.
              Motivos:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>A IA responderá <strong>todos</strong> os contatos que mandarem mensagem (incluindo familiares e amigos, se for seu número pessoal).</li>
              <li>O WhatsApp pode banir números que enviam mensagens em alta frequência. Um número dedicado isola esse risco.</li>
              <li>Você pode pausar ou desconectar o atendente a qualquer momento sem afetar suas conversas pessoais.</li>
            </ul>

            <h3 className="text-base font-semibold text-brand-text mt-5 mb-2">Filtros (opcional)</h3>
            <p>
              Em <strong>Ajustes &gt; WhatsApp</strong> você pode ativar dois filtros:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Lista permitida (whitelist):</strong> a IA responde APENAS aos números que você adicionar. Útil pra testar com poucos contatos antes de abrir geral.</li>
              <li><strong>Apenas fora do horário:</strong> a IA só responde quando seu negócio está fechado. Durante o horário comercial, você (ou seu time) atende manualmente.</li>
            </ul>
            <p className="mt-2 text-xs text-brand-muted">
              <strong>Atenção:</strong> com a whitelist ativada e vazia, ninguém recebe resposta automática.
            </p>

            <h3 className="text-base font-semibold text-brand-text mt-5 mb-2">Se a conexão cair</h3>
            <p>
              O WhatsApp pode desconectar se: o celular ficar muito tempo sem internet, você fizer
              logout no app do celular, ou se passarem ~14 dias sem o celular abrir o WhatsApp.
              Quando isso acontecer, abra <strong>Ajustes &gt; WhatsApp</strong>, clique em <strong>Reconectar</strong>
              e refaça o QR.
            </p>
          </section>

          <section id="inbox">
            <h2 className="text-xl font-semibold text-brand-text mb-3">6. Acompanhar conversas (Inbox)</h2>
            <p>
              O menu <strong>Conversas</strong> mostra todas as conversas em andamento. Para cada uma,
              você vê o status:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Ativa</strong> — IA está respondendo normalmente.</li>
              <li><strong>Precisa atenção</strong> — IA detectou que precisa de humano (assunto sensível, reclamação, palavra de transferência configurada). <strong>Você precisa entrar e responder.</strong></li>
              <li><strong>Encerrada</strong> — conversa finalizada manualmente ou inativa há muito tempo.</li>
            </ul>

            <h3 className="text-base font-semibold text-brand-text mt-5 mb-2">Assumir uma conversa</h3>
            <p>
              Clicando numa conversa, você vê o histórico completo. Pra responder você mesmo
              (em vez da IA), digite no campo de mensagem e clique em <strong>Enviar</strong>. A IA
              fica em silêncio nessa conversa enquanto você está atendendo.
            </p>
          </section>

          <section id="voz">
            <h2 className="text-xl font-semibold text-brand-text mb-3">7. Configurar a voz (opcional)</h2>
            <p>
              No plano Pro e Business, o atendente pode mandar mensagens em áudio (voz sintética
              em português brasileiro). Em <strong>Ajustes &gt; Voz</strong>:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Escolha uma voz padrão e teste com qualquer texto.</li>
              <li>O preview funciona em <strong>todos os planos</strong> — você pode ouvir antes de assinar.</li>
              <li>O envio automático de áudio em conversas reais requer plano Pro ou Business.</li>
              <li>O plano Business permite clonar uma voz própria (entre em contato).</li>
            </ul>
          </section>

          <section id="notificacoes">
            <h2 className="text-xl font-semibold text-brand-text mb-3">8. Notificações para você</h2>
            <p>
              Você é avisado quando a IA transfere uma conversa para humano. Em <strong>Ajustes &gt; Notificações</strong>:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Email</strong> — vai pro email da sua conta. Funciona em todos os planos.</li>
              <li><strong>WhatsApp</strong> — vai pro número que você cadastrar como &quot;dono&quot;. Útil se você não checa email frequentemente.</li>
              <li><strong>Ambos</strong> — recebe nos dois canais.</li>
            </ul>
          </section>

          <section id="plano">
            <h2 className="text-xl font-semibold text-brand-text mb-3">9. Plano, uso e cobrança</h2>
            <p>O Attendly tem três planos:</p>
            <table className="w-full text-sm mt-3 border-collapse">
              <thead>
                <tr className="border-b border-brand-border text-left text-brand-text">
                  <th className="py-2 pr-3">Plano</th>
                  <th className="py-2 pr-3">Preço</th>
                  <th className="py-2 pr-3">Mensagens/mês</th>
                  <th className="py-2">Voz</th>
                </tr>
              </thead>
              <tbody className="text-brand-muted">
                <tr className="border-b border-brand-border/50">
                  <td className="py-2 pr-3">Starter</td>
                  <td className="py-2 pr-3">R$ 147</td>
                  <td className="py-2 pr-3">500</td>
                  <td className="py-2">—</td>
                </tr>
                <tr className="border-b border-brand-border/50">
                  <td className="py-2 pr-3">Pro</td>
                  <td className="py-2 pr-3">R$ 297</td>
                  <td className="py-2 pr-3">2.500</td>
                  <td className="py-2">30 minutos</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3">Business</td>
                  <td className="py-2 pr-3">R$ 597</td>
                  <td className="py-2 pr-3">10.000</td>
                  <td className="py-2">2 horas + voz própria</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-3">
              Acima do limite, cada mensagem extra custa entre R$ 0,05 e R$ 0,12 (varia por plano).
              Você acompanha uso e excedente em <strong>Plano &amp; Uso</strong>.
            </p>
            <p className="mt-3">
              Pra mudar de plano, vá em <strong>Plano &amp; Uso &gt; Fazer upgrade</strong>. O cancelamento
              é a qualquer momento e o acesso continua até o fim do ciclo já pago.
            </p>
          </section>

          <section id="logs">
            <h2 className="text-xl font-semibold text-brand-text mb-3">10. Logs e diagnóstico</h2>
            <p>
              O menu <strong>Logs</strong> mostra o histórico técnico de toda mensagem processada,
              incluindo erros. Você não precisa olhar isso no dia-a-dia, mas é útil quando:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Um cliente diz que mandou mensagem e não recebeu resposta — verifique se o evento aparece.</li>
              <li>Você suspeita que algum erro está acontecendo (atrasos, respostas estranhas).</li>
              <li>Quer reportar um problema pro suporte (copie o ID do erro).</li>
            </ul>
            <p className="mt-2">
              Use o filtro <strong>&quot;Apenas erros&quot;</strong> para ver só o que precisa de atenção.
              Logs com mais de 90 dias são apagados automaticamente.
            </p>
          </section>

          <section id="boas-praticas">
            <h2 className="text-xl font-semibold text-brand-text mb-3">11. Boas práticas</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Comece com whitelist.</strong> Nas primeiras 24-48h, deixe a whitelist ativa com 2-3 números seus pra validar respostas antes de abrir geral.</li>
              <li><strong>Avise os clientes que é uma IA.</strong> Não é só boa prática de transparência — é exigência da LGPD em alguns casos. Adicione algo como &quot;Atendimento inicial por IA. Para falar com humano, peça transferência&quot; na sua mensagem inicial.</li>
              <li><strong>Revise as FAQ semanalmente.</strong> Anote as perguntas que aparecem com frequência e adicione na FAQ — a IA fica melhor a cada ajuste.</li>
              <li><strong>Não use número pessoal.</strong> Mesmo se você só atende família/amigos pelo WhatsApp pessoal, o risco de ban e a confusão de mensagens não compensa.</li>
              <li><strong>Cheque a inbox 1x por dia.</strong> Conversas marcadas como &quot;precisa atenção&quot; ficam paradas até alguém responder.</li>
              <li><strong>Responda transferências em até 1h.</strong> Cliente que pediu humano e ficou sem resposta vira reclamação.</li>
            </ul>
          </section>

          <section id="suporte">
            <h2 className="text-xl font-semibold text-brand-text mb-3">12. Suporte</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Dúvidas de uso:</strong> <a href="mailto:suporte@verelus.com" className="text-brand-trust hover:underline">suporte@verelus.com</a></li>
              <li><strong>Cobrança e plano:</strong> <a href="mailto:financeiro@verelus.com" className="text-brand-trust hover:underline">financeiro@verelus.com</a></li>
              <li><strong>Privacidade e LGPD:</strong> <a href="mailto:privacidade@verelus.com" className="text-brand-trust hover:underline">privacidade@verelus.com</a></li>
            </ul>
            <p className="mt-3 text-xs text-brand-muted">
              Resposta em até 1 dia útil. Para clientes Business, atendimento prioritário em até 4 horas em dias úteis.
            </p>
          </section>

        </div>

        <footer className="mt-16 pt-6 border-t border-brand-border text-xs text-brand-muted text-center">
          <p>
            Manual atualizado em 24 de abril de 2026. Veja também:{' '}
            <a href="/privacy" className="text-brand-trust hover:underline">Política de Privacidade</a>
            {' '}e{' '}
            <a href="/terms" className="text-brand-trust hover:underline">Termos de Uso</a>.
          </p>
        </footer>
      </article>
    </div>
  );
}
