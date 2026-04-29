import type { Metadata } from 'next';
import Link from 'next/link';
import { BlogPostShell } from '../_components/BlogPostShell';
import { getPostBySlug } from '../posts';

const meta = getPostBySlug('chatbot-gratis-vs-pago-pme-brasileira')!;

export const metadata: Metadata = {
  title: `${meta.title} | Verelus`,
  description: meta.description,
  keywords: meta.keywords,
  openGraph: {
    title: meta.title,
    description: meta.description,
    type: 'article',
    url: `https://verelus.com/blog/${meta.slug}`,
    siteName: 'Verelus',
    publishedTime: meta.publishedAt,
    images: [{ url: 'https://verelus.com/og-attendly.png', width: 1200, height: 630, alt: meta.title }],
  },
  twitter: {
    card: 'summary_large_image',
    title: meta.title,
    description: meta.description,
    images: ['https://verelus.com/og-attendly.png'],
  },
  alternates: { canonical: `https://verelus.com/blog/${meta.slug}` },
};

export default function Post() {
  return (
    <BlogPostShell meta={meta}>
      <p>
        "Existe chatbot grátis que faça isso?" é uma das perguntas que mais ouvimos de
        donos de PME. A resposta honesta é: sim, existe — mas dá conta de uma fatia
        específica das suas necessidades. Pular pro pago antes de entender o grátis é
        gastar dinheiro à toa. Ficar no grátis quando o negócio cresceu é perder cliente.
      </p>
      <p>
        Este artigo mostra honestamente o que cada lado entrega, quando cada um vale a pena,
        e como decidir sem se perder no marketing das ferramentas.
      </p>

      <h2>O que existe de grátis hoje</h2>
      <p>
        As principais opções gratuitas para PMEs brasileiras:
      </p>
      <ol>
        <li>
          <strong>WhatsApp Business app:</strong> mensagem automática de saudação,
          mensagem de ausência fora do horário, respostas rápidas (atalhos), etiquetas,
          catálogo de produtos. Grátis para sempre.
        </li>
        <li>
          <strong>Manychat free:</strong> bots de Instagram e Facebook Messenger com
          fluxos pré-programados. Limite de 1.000 contatos no plano grátis. Não cobre
          WhatsApp gratuitamente — só com pagamento.
        </li>
        <li>
          <strong>Tidio free:</strong> chatbot básico para site, com limite de 50 conversas
          por mês. Não tem IA de verdade, são só fluxos de botões.
        </li>
        <li>
          <strong>DIY com ChatGPT API + Make/Zapier:</strong> tecnicamente "grátis" no
          início (créditos free da OpenAI duram pouco; Make tem 1.000 operações grátis/mês).
          Funciona, mas exige montagem manual e quebra com frequência.
        </li>
      </ol>

      <h2>Limitações reais do grátis</h2>
      <p>
        O que você descobre na prática quando tenta operar com chatbot grátis em volume real:
      </p>
      <ul>
        <li>
          <strong>Sem IA conversacional:</strong> a maioria dos grátis usa só fluxos
          ("digite 1 para X, 2 para Y"). Cliente sai do menu e o sistema trava ou repete.
        </li>
        <li>
          <strong>Limites apertados:</strong> 50 conversas/mês = ~2 por dia. Qualquer
          PME com volume real estoura em uma semana.
        </li>
        <li>
          <strong>Sem WhatsApp nativo:</strong> a maioria das ferramentas grátis não cobre
          o WhatsApp (que é o canal real onde clientes brasileiros falam). Cobrem só
          Messenger ou site.
        </li>
        <li>
          <strong>Marca d'água e branding da plataforma:</strong> "Powered by Tidio" no rodapé
          do widget passa amadorismo. Cliente percebe.
        </li>
        <li>
          <strong>Suporte zero:</strong> se algo quebra, você se vira. Para negócio que
          depende do canal, isso é risco real.
        </li>
      </ul>

      <h2>O que o pago entrega de diferente</h2>
      <p>
        Plataformas pagas decentes (R$ 100-500/mês) cobrem o que o grátis não cobre:
      </p>
      <ul>
        <li>
          <strong>IA conversacional de verdade:</strong> entende perguntas em linguagem
          natural, não exige menu, responde como humano. Diferença de qualidade brutal.
        </li>
        <li>
          <strong>WhatsApp nativo</strong> via QR Code ou Cloud API oficial.
        </li>
        <li>
          <strong>Sem limite apertado:</strong> mensagens ilimitadas dentro do plano,
          ou limites altos (1.000-10.000/mês) que cobrem PMEs reais.
        </li>
        <li>
          <strong>Painel de gestão completo:</strong> dashboard, histórico, métricas,
          ajuste fino da IA, transferência inteligente para humano.
        </li>
        <li>
          <strong>Suporte ativo:</strong> alguém pra ligar quando algo dá errado em horário
          comercial. Nas plataformas brasileiras decentes, suporte em português direto no
          WhatsApp.
        </li>
      </ul>

      <h2>Quando o grátis basta</h2>
      <p>
        O grátis (especificamente o WhatsApp Business app) cobre bem se você:
      </p>
      <ul>
        <li>Recebe menos de 10 mensagens por dia.</li>
        <li>Atende personalmente todas elas em até 1 hora durante o expediente.</li>
        <li>Não recebe mensagens fora do horário, ou tudo bem se elas esperarem até o dia seguinte.</li>
        <li>Não está perdendo cliente para o concorrente que responde mais rápido.</li>
      </ul>
      <p>
        Se você bate todas essas, comece com WhatsApp Business app + uma boa mensagem
        automática de ausência. Não gaste com pago ainda.
      </p>

      <h2>Quando o pago paga sozinho</h2>
      <p>
        Faça uma conta simples: <strong>quantos clientes por mês você está perdendo por
        atendimento atrasado ou inexistente?</strong>
      </p>
      <p>
        Em PMEs típicas (salão, clínica, restaurante, academia), o ticket médio fica entre
        R$ 80 e R$ 400. Se você está perdendo apenas 2 clientes por mês para a concorrência
        por demora de resposta, isso já justifica um plano de R$ 147/mês de chatbot pago.
      </p>
      <p>
        Sinais de que o pago vale:
      </p>
      <ul>
        <li>20+ mensagens por dia no WhatsApp</li>
        <li>Mais de 30% delas chegam fora do horário</li>
        <li>Você ou alguém do time gasta &gt; 1h/dia respondendo perguntas repetitivas</li>
        <li>Concorrentes diretos já automatizam (você nota porque eles respondem em segundos)</li>
      </ul>

      <h2>Recomendação por estágio</h2>
      <p>
        <strong>Estágio 1 — você é o único atendente, volume baixo:</strong> WhatsApp Business
        app + mensagem de ausência caprichada. Custo zero. Funciona até ~200 mensagens/mês.
      </p>
      <p>
        <strong>Estágio 2 — volume crescendo, atendimento atrasando:</strong> mude para SaaS
        de chatbot com IA. Plano starter de R$ 100-200/mês paga sozinho com 1-2 vendas extras.
        O <Link href="/attendly">Attendly</Link>, por exemplo, tem trial 7 dias grátis sem
        cartão pra testar a tese.
      </p>
      <p>
        <strong>Estágio 3 — múltiplas filiais ou equipe atendendo em conjunto:</strong>
        plano superior (R$ 300-700/mês) com integrações, múltiplos números e gestão de
        equipe. Vale só com volume comprovado.
      </p>

      <h2>Conclusão</h2>
      <p>
        Não existe "melhor" — existe certo para o seu estágio. Comece grátis se está
        começando, troque assim que o grátis virar gargalo. O pior é continuar no grátis
        quando ele já está te custando vendas — porque essa perda é silenciosa e ninguém
        te avisa.
      </p>
      <p>
        Regra prática: se você sente que está respondendo as mesmas perguntas todo dia,
        é hora de testar o pago. Trial grátis sem cartão tem custo zero pra fazer essa
        comparação.
      </p>
    </BlogPostShell>
  );
}
