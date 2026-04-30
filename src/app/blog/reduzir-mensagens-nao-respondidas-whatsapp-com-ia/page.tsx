import type { Metadata } from 'next';
import Link from 'next/link';
import { BlogPostShell } from '../_components/BlogPostShell';
import { getPostBySlug } from '../posts';

const meta = getPostBySlug('reduzir-mensagens-nao-respondidas-whatsapp-com-ia')!;

export const metadata: Metadata = {
  title: `${meta.title} | Atalaia`,
  description: meta.description,
  keywords: meta.keywords,
  openGraph: {
    title: meta.title,
    description: meta.description,
    type: 'article',
    url: `https://atalaia.verelus.com/blog/${meta.slug}`,
    siteName: 'Atalaia',
    publishedTime: meta.publishedAt,
    images: [{ url: 'https://atalaia.verelus.com/og-atalaia.png', width: 1200, height: 630, alt: meta.title }],
  },
  twitter: {
    card: 'summary_large_image',
    title: meta.title,
    description: meta.description,
    images: ['https://atalaia.verelus.com/og-atalaia.png'],
  },
  alternates: { canonical: `https://atalaia.verelus.com/blog/${meta.slug}` },
};

export default function Post() {
  return (
    <BlogPostShell meta={meta}>
      <p>
        "Mensagem não respondida" é a métrica mais cara do WhatsApp do seu negócio que ninguém
        olha direito. Cada mensagem que fica sem resposta é um cliente em modo de compra
        perdendo paciência. Em PMEs típicas, esse número fica entre 30% e 60% do volume
        total — e ninguém percebe porque cliente não avisa que desistiu.
      </p>
      <p>
        A boa notícia: dá pra reduzir isso em 80% ou mais com IA bem configurada, em 2 a 4
        semanas de uso. Aqui vão as 4 estratégias que entregam isso na prática.
      </p>

      <h2>Por que mensagens ficam não respondidas</h2>
      <p>
        Antes da solução, entenda os 3 motivos principais:
      </p>
      <ol>
        <li>
          <strong>Você está ocupado fazendo outra coisa.</strong> Cliente sentado na sua frente,
          telefone tocando, fornecedor cobrando. WhatsApp fica em terceiro plano.
        </li>
        <li>
          <strong>Mensagem chega fora do horário.</strong> 22h, sábado de manhã antes de abrir,
          domingo. Quando você abre o WhatsApp depois, são 18 mensagens, você responde as 5
          mais recentes e as outras 13 ficam pra trás.
        </li>
        <li>
          <strong>Pergunta complicada que você prefere "pensar depois".</strong> Cliente
          pediu orçamento detalhado, você não tem 10 min agora, deixa pra fazer "à tarde",
          esquece.
        </li>
      </ol>
      <p>
        Cada motivo tem solução diferente. Vamos por partes.
      </p>

      <h2>Estratégia 1: cobrir as perguntas repetitivas com IA (~50% do problema)</h2>
      <p>
        80% das mensagens em PMEs são perguntas que se repetem todo dia: horário, preço,
        localização, disponibilidade. Você responde porque o cliente perguntou, não porque
        é decisão estratégica.
      </p>
      <p>
        IA bem configurada responde essas em segundos, 24/7, sem você precisar ver. Sozinha,
        essa estratégia derruba 50% das mensagens "não respondidas" — porque elas viram
        "respondidas instantaneamente".
      </p>
      <p>
        <strong>O truque é cadastrar as 10-15 perguntas mais comuns com respostas detalhadas.</strong>{' '}
        Não economize. "Sim, fazemos delivery" é diferente de "Sim, fazemos delivery em até
        7km do salão (bairros X, Y, Z), taxa fixa R$ 8, leva 30-40 minutos".
      </p>

      <h2>Estratégia 2: responder fora do horário sem custo humano (~25% do problema)</h2>
      <p>
        Cliente que manda mensagem às 22h espera resposta no dia seguinte. Cliente que
        recebe resposta às 22h02 fica impressionado. Diferença emocional brutal.
      </p>
      <p>
        IA responde 24/7 — não dorme, não tira folga. Para horários "delicados" (madrugada),
        configure a IA para responder com tom adequado: "Estamos fechados agora, mas posso
        te ajudar com o que você precisa e marcar pra amanhã às 9h."
      </p>
      <p>
        Cobertura típica: das 30%-50% de mensagens que chegam fora do horário em PMEs
        brasileiras, IA responde 90% delas no mesmo padrão de qualidade que humano responderia.
      </p>

      <h2>Estratégia 3: notificação inteligente para o que precisa de humano (~15% do problema)</h2>
      <p>
        A IA bem feita não tenta resolver tudo. Ela <strong>identifica o que é complexo</strong>{' '}
        e te avisa imediatamente, com contexto.
      </p>
      <p>
        Exemplo: cliente novo pede orçamento detalhado de evento. A IA responde "vou
        encaminhar pro nosso time, que retorna em até 30 minutos" e te manda notificação
        com nome, número e a pergunta. Você responde quando puder, mas o cliente já viu
        confirmação imediata.
      </p>
      <p>
        Resultado: as mensagens que precisam de você não viram "esquecidas" — entram numa
        fila visível, com tempo de resposta acordado, com contexto. Você responde 5
        mensagens da fila em 15 minutos focado, em vez de 25 espalhadas pelo dia.
      </p>

      <h2>Estratégia 4: confirmar agendamentos automaticamente (~10% do problema)</h2>
      <p>
        Boa parte das mensagens "perdidas" são na verdade <strong>confirmações de agendamento</strong>{' '}
        que ficaram no ar. Cliente marca às 16h, era pra confirmar de véspera, ninguém
        confirmou, cliente esquece, no-show.
      </p>
      <p>
        Configure a IA para mandar confirmação automática 24h antes do horário: "Lembrete:
        seu horário de manicure amanhã às 14h. Pode confirmar?". Resposta vira automática.
      </p>
      <p>
        Negócios que implementam isso reportam queda de 60-80% no no-show, e a interação
        nem aparece como "mensagem não respondida" porque ela é proativa.
      </p>

      <h2>Como medir o baseline</h2>
      <p>
        Antes de começar, meça onde você está hoje. Sem baseline, não dá pra dizer se
        melhorou. Métrica simples:
      </p>
      <ol>
        <li>
          Conte o total de conversas iniciadas por cliente nas últimas 4 semanas.
        </li>
        <li>
          Conte quantas dessas tiveram primeira resposta sua em até 5 minutos.
        </li>
        <li>
          Calcule a porcentagem. Esse é seu baseline de "responsividade".
        </li>
      </ol>
      <p>
        PMEs sem automação geralmente ficam entre 20% e 50% de conversas com resposta em 5
        minutos. Com IA cobrindo as perguntas comuns, esse número sobe pra 90%+ em 2-3
        semanas.
      </p>
      <p>
        O WhatsApp Business app mostra "Tempo médio de resposta" no perfil do negócio.
        Use isso como métrica complementar.
      </p>

      <h2>Quanto tempo leva pra ver resultado</h2>
      <ul>
        <li>
          <strong>Semana 1:</strong> setup. Você cadastra info, testa, ajusta. Sem efeito
          ainda no volume real.
        </li>
        <li>
          <strong>Semana 2:</strong> IA no ar. Métrica começa a melhorar — respostas
          imediatas para 60-70% das mensagens.
        </li>
        <li>
          <strong>Semana 3-4:</strong> ajustes finos. Você corrige os casos que IA errou
          (geralmente 5-10 ajustes no painel). Cobertura sobe pra 85-90%.
        </li>
        <li>
          <strong>Mês 2:</strong> estado estável. 80%+ de redução em mensagens não respondidas
          mantém-se sem manutenção pesada.
        </li>
      </ul>

      <h2>Conclusão</h2>
      <p>
        Reduzir mensagens não respondidas é, em essência, sobre fazer a sua presença online
        ser independente da sua presença física. IA não substitui você nas conversas
        importantes — ela libera você das repetitivas, garante resposta 24/7, e te avisa
        quando precisa entrar em ação.
      </p>
      <p>
        Para PMEs com volume real, a redução de 80%+ é alcançável em 4 semanas. O custo de
        ferramentas decentes (R$ 100-300/mês) é ridículo perto do custo do cliente que
        desistiu porque você demorou a responder. Se você quer testar, o{' '}
        <Link href="/atalaia">Atalaia</Link> oferece 7 dias grátis sem cartão pra você
        medir a diferença.
      </p>
    </BlogPostShell>
  );
}
