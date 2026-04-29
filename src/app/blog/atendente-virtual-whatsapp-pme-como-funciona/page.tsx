import type { Metadata } from 'next';
import Link from 'next/link';
import { BlogPostShell } from '../_components/BlogPostShell';
import { getPostBySlug } from '../posts';

const meta = getPostBySlug('atendente-virtual-whatsapp-pme-como-funciona')!;

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
    images: [
      {
        url: 'https://verelus.com/og-atalaia.png',
        width: 1200,
        height: 630,
        alt: meta.title,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: meta.title,
    description: meta.description,
    images: ['https://verelus.com/og-atalaia.png'],
  },
  alternates: { canonical: `https://verelus.com/blog/${meta.slug}` },
};

export default function Post() {
  return (
    <BlogPostShell meta={meta}>
      <p>
        Se você é dono de uma PME no Brasil, provavelmente já chegou em casa às 22h
        e viu o WhatsApp do negócio com 12 mensagens não respondidas. Cliente perguntando
        horário, pedindo orçamento, querendo agendar. Quando você responde no dia seguinte,
        metade já comprou no concorrente.
      </p>
      <p>
        Esse é o tipo de problema que o <strong>atendente virtual de WhatsApp</strong> resolve.
        Mas a internet está cheia de promessas exageradas e ferramentas confusas.
        Aqui vai o que importa de verdade — sem hype.
      </p>

      <h2>O que é um atendente virtual de WhatsApp</h2>
      <p>
        É um software que responde automaticamente as mensagens dos seus clientes no WhatsApp,
        com base nas informações do seu negócio (serviços, preços, horários, regras).
        Diferente de um chatbot tradicional cheio de menus de "digite 1, digite 2", um atendente
        virtual moderno usa IA para entender perguntas em linguagem natural e responder como
        se fosse uma pessoa.
      </p>
      <p>
        A diferença prática:
      </p>
      <ul>
        <li>
          <strong>Chatbot antigo:</strong> "Olá! Digite 1 para horários, 2 para preços, 3 para
          agendar." Cliente perde paciência e desiste.
        </li>
        <li>
          <strong>Atendente virtual moderno:</strong> Cliente escreve "vocês fazem coloração no
          sábado e quanto custa?" e a IA responde com horário disponível, preço e oferece o
          agendamento direto.
        </li>
      </ul>

      <h2>Como funciona tecnicamente</h2>
      <p>
        Por baixo dos panos, o sistema tem três peças:
      </p>
      <ol>
        <li>
          <strong>Integração com o WhatsApp.</strong> Pode ser via WhatsApp Business API
          oficial (Meta Cloud API) ou via Evolution API / Baileys (não-oficial). Cada uma tem
          custo, regras e risco de banimento diferentes.
        </li>
        <li>
          <strong>Modelo de IA.</strong> Hoje em dia, os melhores atendentes virtuais usam
          modelos como Claude (Anthropic) ou GPT (OpenAI) para gerar respostas. Esses modelos
          recebem o contexto do seu negócio e a mensagem do cliente, e geram a resposta em 1-2 segundos.
        </li>
        <li>
          <strong>Painel de gestão.</strong> Onde você configura serviços, preços, horários,
          FAQ; vê todas as conversas; ajusta a IA quando ela errar; e recebe alertas quando
          precisa intervir.
        </li>
      </ol>
      <p>
        O bom é que você não precisa programar nada. Os atendentes virtuais bons hoje têm
        formulários simples para cadastrar as informações do negócio, e a IA aprende automaticamente.
      </p>

      <h2>Atendente virtual vs WhatsApp Business vs chatbot tradicional</h2>
      <p>
        Três coisas diferentes que se confundem:
      </p>
      <table>
        <thead>
          <tr>
            <th>Solução</th>
            <th>O que faz</th>
            <th>Custo típico</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>WhatsApp Business (app)</td>
            <td>Mensagens automáticas básicas (saudação, ausência), etiquetas, catálogo</td>
            <td>Grátis</td>
          </tr>
          <tr>
            <td>Chatbot tradicional</td>
            <td>Menu de botões, fluxos pré-programados, sem IA</td>
            <td>R$ 50-300/mês</td>
          </tr>
          <tr>
            <td>Atendente virtual com IA</td>
            <td>Conversa natural, agenda, qualifica lead, integra WhatsApp + site</td>
            <td>R$ 100-500/mês</td>
          </tr>
        </tbody>
      </table>
      <p>
        O WhatsApp Business resolve o básico, mas trava na hora que o cliente foge do roteiro
        ("posso pagar em 3 vezes?"). O chatbot tradicional ainda é melhor que nada, mas frustra
        o cliente em qualquer pergunta fora do menu. O atendente virtual com IA cobre tudo isso
        e ainda escala — atende 50 clientes ao mesmo tempo sem perder qualidade.
      </p>

      <h2>Quanto custa de verdade</h2>
      <p>
        O preço varia muito porque tem soluções gratuitas (limitadas) até plataformas
        empresariais cobrando milhares por mês. Para PMEs no Brasil, o range realista é:
      </p>
      <ul>
        <li>
          <strong>R$ 0:</strong> Soluções DIY juntando ChatGPT API + Make/Zapier + WhatsApp
          Cloud API. Funciona, mas você precisa configurar tudo, monitorar erros, manter.
          Tempo é dinheiro — fica barato só se você é técnico e tem tempo sobrando.
        </li>
        <li>
          <strong>R$ 100-300/mês:</strong> Plataformas SaaS focadas em PMEs (incluindo o{' '}
          <Link href="/atalaia">Atalaia</Link>). Setup em minutos, sem código, suporte
          incluído. Limites por número de mensagens.
        </li>
        <li>
          <strong>R$ 500-2000/mês:</strong> Soluções para volume alto ou múltiplas filiais,
          com integrações customizadas, gestor de conta, SLA.
        </li>
        <li>
          <strong>R$ 2000+/mês:</strong> Customizado, normalmente para empresas grandes com
          equipe técnica própria.
        </li>
      </ul>
      <p>
        Para a maioria das PMEs (salão, clínica, restaurante, academia, prestador de serviço),
        a faixa de R$ 100-300/mês cobre 90% das necessidades. Comparado a contratar uma
        atendente humana adicional (R$ 1.500-3.000/mês mais encargos), o ROI é óbvio.
      </p>

      <h2>Quando vale a pena adotar</h2>
      <p>
        Não é toda PME que precisa de atendente virtual. Os sinais de que você está pronto:
      </p>
      <ul>
        <li>
          <strong>Você recebe 20+ mensagens por dia no WhatsApp do negócio.</strong>
          Abaixo disso, você consegue responder sozinho sem perder cliente.
        </li>
        <li>
          <strong>Pelo menos 30% dessas mensagens são fora do horário comercial.</strong>
          Esse é o cliente que você está perdendo silenciosamente.
        </li>
        <li>
          <strong>A maioria das perguntas é repetitiva</strong> ("vocês atendem sábado?",
          "quanto custa X?", "funcionam no bairro Y?"). IA faz isso bem; não precisa
          de humano.
        </li>
        <li>
          <strong>Você ou alguém da equipe está saturado de responder mensagens.</strong>
          Se o atendimento está roubando horas que deveriam ser de gestão ou execução do
          serviço, automatizar libera tempo.
        </li>
      </ul>
      <p>
        Se você ainda recebe 5 mensagens por dia, foco em conseguir mais clientes primeiro.
        Atendente virtual resolve volume, não falta dele.
      </p>

      <h2>Como começar (sem perder tempo)</h2>
      <p>
        Se você decidiu testar, o caminho mais rápido é:
      </p>
      <ol>
        <li>
          <strong>Escolha uma plataforma com trial grátis.</strong> Você precisa ver funcionando
          com seus próprios dados antes de pagar. O Atalaia oferece 7 dias grátis sem cartão —
          tempo suficiente para sentir se faz sentido.
        </li>
        <li>
          <strong>Cadastre as informações reais do seu negócio.</strong> Não enche linguiça.
          Coloque os serviços de verdade, preços de verdade, horários de verdade, e as 5-10
          perguntas que clientes mais fazem. A IA é só tão boa quanto os dados que você dá.
        </li>
        <li>
          <strong>Conecte um número WhatsApp dedicado.</strong> Não use seu pessoal. Compre um
          chip pré-pago de R$ 30 ou use um SIM virtual. A IA não deve responder seus parentes.
        </li>
        <li>
          <strong>Teste como cliente.</strong> Mande 5-10 mensagens diferentes de outro número:
          fáceis, difíceis, esquisitas. Veja o que a IA responde. Onde ela errou, ajuste o
          contexto no painel.
        </li>
        <li>
          <strong>Vá ao ar e monitore.</strong> Na primeira semana, olhe o dashboard 1-2 vezes
          por dia. Você vai pegar erros que precisam de ajuste fino. Depois disso, só monitora
          quando a IA pedir transferência.
        </li>
      </ol>

      <h2>O que fica de fora (limites reais)</h2>
      <p>
        Pra você não chegar com expectativa errada, três coisas que atendente virtual ainda
        não resolve bem:
      </p>
      <ul>
        <li>
          <strong>Negociação complexa.</strong> Cliente discutindo preço, prazo, condições
          especiais — humano ainda fecha melhor. A IA encaminha para você.
        </li>
        <li>
          <strong>Reclamação séria.</strong> Cliente irritado quer falar com gente. A IA
          deve detectar tom e transferir, não tentar resolver.
        </li>
        <li>
          <strong>Decisões fora do roteiro.</strong> "Posso pagar parcelado em 6 vezes mesmo
          sem ser cliente?" — não dê liberdade pra IA improvisar nessas situações; configure
          ela pra dizer que vai consultar e te avisar.
        </li>
      </ul>

      <h2>Conclusão</h2>
      <p>
        Atendente virtual de WhatsApp é uma ferramenta de produtividade para quem tem volume
        de atendimento e quer parar de perder cliente fora do horário. Não é mágica e não
        substitui você em decisões importantes — mas tira do seu colo as 50 perguntas
        repetitivas por dia que estão consumindo sua energia.
      </p>
      <p>
        Para PMEs brasileiras, o custo de R$ 100-300/mês paga sozinho com 1-2 clientes a mais
        por mês fechados fora do horário. Se você está perdendo isso e ainda não testou, a
        conta não fecha mais.
      </p>
    </BlogPostShell>
  );
}
