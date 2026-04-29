import type { Metadata } from 'next';
import Link from 'next/link';
import { BlogPostShell } from '../_components/BlogPostShell';
import { getPostBySlug } from '../posts';

const meta = getPostBySlug('whatsapp-business-vs-ia-salao-de-beleza')!;

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
        Salão de beleza e barbearia são dois dos setores brasileiros que mais dependem do
        WhatsApp para fechar venda. Cliente vê o trabalho no Instagram, manda mensagem
        perguntando "quanto custa progressiva?", e a velocidade da resposta decide se ela
        marca com você ou com o salão da rua de cima.
      </p>
      <p>
        Quase todo salão usa o WhatsApp Business hoje. Cada vez mais experimentam IA. A
        dúvida prática é: <strong>quando vale ficar com WhatsApp Business e quando dar o
        próximo passo?</strong> Esse artigo cobre isso especificamente para salão e barbearia,
        com cenários reais.
      </p>

      <h2>O que o WhatsApp Business resolve</h2>
      <p>
        O app gratuito da Meta tem features bem feitas que muito salão ainda não usa direito:
      </p>
      <ul>
        <li>
          <strong>Mensagem de saudação automática:</strong> dispara assim que cliente nova
          entra em contato. "Oi! Sou a IA do Salão X, em que posso ajudar?"
        </li>
        <li>
          <strong>Mensagem de ausência:</strong> fora do horário, dispara automaticamente.
          "Estamos fechados, voltamos terça às 9h."
        </li>
        <li>
          <strong>Respostas rápidas:</strong> atalhos para reaproveitar respostas comuns.
          Você digita "/horario" e ele cola sua tabela de horários.
        </li>
        <li>
          <strong>Etiquetas:</strong> organize clientes por status (novo, agendado, retornou,
          inativo).
        </li>
        <li>
          <strong>Catálogo:</strong> mostra serviços com fotos e preços direto no perfil.
        </li>
      </ul>
      <p>
        Tudo grátis. Para um salão pequeno (1-2 profissionais, ~10 mensagens/dia),
        o WhatsApp Business bem configurado já cobre 60-70% das necessidades.
      </p>

      <h2>O que o WhatsApp Business <em>não</em> resolve</h2>
      <p>
        Aqui mora o problema. As features automáticas do WhatsApp Business são todas
        unidirecionais — ele <em>envia</em> mensagens automáticas, mas <em>não responde</em>
        perguntas reais.
      </p>
      <p>
        Cenários frequentes onde o WhatsApp Business trava:
      </p>
      <ul>
        <li>
          <strong>"Quanto custa luzes? E reflexo?"</strong> — saudação automática responde,
          depois fica em branco até alguém digitar manualmente. Cliente espera.
        </li>
        <li>
          <strong>"Tem horário sábado às 14h?"</strong> — Business não consulta sua agenda,
          não sabe responder. Mensagem fica acumulando.
        </li>
        <li>
          <strong>"Vocês fazem progressiva orgânica?"</strong> — pergunta de catálogo, mas
          o cliente não foi olhar o catálogo, mandou direto. Business não sabe o que fazer.
        </li>
        <li>
          <strong>"Posso parcelar em 4 vezes no cartão?"</strong> — pergunta sobre forma
          de pagamento, sem resposta automática.
        </li>
        <li>
          <strong>22h da noite, cliente novo manda 5 mensagens em sequência:</strong> a
          mensagem de ausência responde a primeira, as outras 4 ficam empilhando até o dia
          seguinte. Cliente já decidiu que vai pro outro salão até lá.
        </li>
      </ul>
      <p>
        Em todos esses casos, alguém humano precisa entrar manualmente. No salão pequeno,
        normalmente é a dona, que está com a cliente sentada na cadeira. Resultado: ou
        atrasa o atendimento de quem está ali, ou perde o lead novo.
      </p>

      <h2>Como a IA cobre o gap</h2>
      <p>
        Atendente com IA (como o <Link href="/attendly/salao">Attendly para salão de
        beleza</Link>) responde tudo isso automaticamente, no padrão do seu salão:
      </p>
      <ul>
        <li>
          <strong>Sabe os preços de todos os serviços</strong> que você cadastrou. Cliente
          pergunta progressiva, ele responde valor + tempo.
        </li>
        <li>
          <strong>Conhece seus horários</strong> e responde se tem dia/horário disponível
          conforme o que você definiu.
        </li>
        <li>
          <strong>Identifica quando precisa de humano</strong> e te transfere com contexto.
          Cliente reclamando? Pra você. Cliente pedindo orçamento muito complexo? Pra você.
        </li>
        <li>
          <strong>Funciona 24h por dia</strong> sem você precisar ver o celular. Cliente
          que perguntou às 23h tem resposta às 23h.
        </li>
        <li>
          <strong>Aguenta múltiplas conversas em paralelo</strong> — 5 clientes mandando
          mensagem ao mesmo tempo na sexta à noite, todos recebem resposta na mesma velocidade.
        </li>
      </ul>

      <h2>Caso prático: uma manhã de sábado no salão</h2>
      <p>
        <strong>Com WhatsApp Business apenas:</strong>
      </p>
      <ul>
        <li>9h00 — Cliente nova manda "oi, fazem progressiva?". Saudação responde, espera.</li>
        <li>9h05 — Você está secando cliente, vê a mensagem de canto. Não responde agora.</li>
        <li>9h15 — Cliente pergunta de novo "estão aí?". Você responde correndo.</li>
        <li>9h20 — Outra cliente nova manda mensagem com 4 perguntas. Você ainda no secador.</li>
        <li>10h30 — Você consegue responder a segunda. Já se passou 1h10. Ela já marcou em outro lugar.</li>
        <li>Final do dia: 3 leads perdidos por demora.</li>
      </ul>
      <p>
        <strong>Com IA atendendo:</strong>
      </p>
      <ul>
        <li>9h00 — Cliente nova manda "oi, fazem progressiva?". IA responde em 5s com valor + duração + horários disponíveis.</li>
        <li>9h02 — Cliente confirma horário. IA marca o agendamento e te avisa por notificação rápida.</li>
        <li>9h20 — Outra cliente manda 4 perguntas. IA responde as 4 em 10s.</li>
        <li>9h22 — Ela pergunta sobre técnica específica que não está no FAQ. IA transfere pra você com contexto.</li>
        <li>11h00 — Você sai do secador, abre WhatsApp, vê 1 mensagem pra responder (a complexa). Outras 2 clientes já marcadas.</li>
        <li>Final do dia: 0 leads perdidos. Você atendeu quem estava na cadeira sem distração.</li>
      </ul>

      <h2>Quando trocar</h2>
      <p>
        Sinais claros de que o WhatsApp Business virou gargalo no salão:
      </p>
      <ul>
        <li>Você recebe 15+ mensagens por dia.</li>
        <li>Cliente reclama de demora pra responder.</li>
        <li>Você responde mensagem com cliente sentada no salão.</li>
        <li>Mensagens fora do horário acumulam mais que 5 por noite.</li>
        <li>Você sente que está perdendo lead pra concorrência mais rápida.</li>
      </ul>
      <p>
        Se você bate 3 ou mais desses, vale testar IA. Trial grátis cobre o teste sem custo.
      </p>

      <h2>Conclusão</h2>
      <p>
        WhatsApp Business é ótimo enquanto o salão é pequeno e o volume cabe nas suas mãos.
        IA entra como a próxima camada — quando o gargalo deixa de ser captação e passa a
        ser <em>velocidade de resposta</em>.
      </p>
      <p>
        Para o salão típico que cresceu 30-50% nos últimos 12 meses, IA paga sozinha em 2-3
        agendamentos extras por mês. Vale fazer o teste.
      </p>
    </BlogPostShell>
  );
}
