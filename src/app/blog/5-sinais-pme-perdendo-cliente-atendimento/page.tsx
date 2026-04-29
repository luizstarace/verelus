import type { Metadata } from 'next';
import Link from 'next/link';
import { BlogPostShell } from '../_components/BlogPostShell';
import { getPostBySlug } from '../posts';

const meta = getPostBySlug('5-sinais-pme-perdendo-cliente-atendimento')!;

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
        url: 'https://verelus.com/og-attendly.png',
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
    images: ['https://verelus.com/og-attendly.png'],
  },
  alternates: { canonical: `https://verelus.com/blog/${meta.slug}` },
};

export default function Post() {
  return (
    <BlogPostShell meta={meta}>
      <p>
        Cliente que sai do seu negócio para o concorrente raramente avisa. Ele simplesmente
        para de responder. E o pior: na maioria das vezes, ele saiu por um motivo que você
        nunca soube.
      </p>
      <p>
        Em PMEs, atendimento é o ponto onde mais se perde dinheiro silenciosamente. Aqui vão
        cinco sinais práticos de que isso pode estar acontecendo com você — e o que fazer
        para resolver cada um sem precisar contratar mais gente.
      </p>

      <h2>1. Mensagens fora do horário ficam sem resposta</h2>
      <p>
        Se você fecha o estabelecimento às 19h e só responde mensagens no dia seguinte,
        está perdendo todo o cliente que escreveu entre 19h e 9h da manhã. Nesse intervalo,
        ele tem 14 horas para procurar a concorrência ou esquecer a vontade de comprar.
      </p>
      <p>
        Dado prático: pelo menos <strong>30% das mensagens recebidas por PMEs no WhatsApp
        chegam fora do horário comercial</strong>, segundo levantamentos da Meta com
        pequenos negócios brasileiros. Para serviços noturnos (delivery, salão, estética),
        esse número passa de 50%.
      </p>
      <p>
        <strong>Solução:</strong> ou alguém do time fica de plantão (caro, ruim para a equipe),
        ou você usa um atendente automático que responde 24/7. Para PMEs, a segunda opção é
        quase sempre mais viável. Veja como o{' '}
        <Link href="/attendly">Attendly</Link> resolve isso.
      </p>

      <h2>2. Tempo médio de resposta passa de 5 minutos</h2>
      <p>
        Estudos de comportamento de consumidor consistentemente mostram a mesma coisa:
        a probabilidade de fechar venda cai pela metade depois dos primeiros 5 minutos
        sem resposta. Cliente em modo de compra é cliente impaciente.
      </p>
      <p>
        Se você está com a equipe ocupada e leva 30 minutos para responder uma pergunta de
        preço, está perdendo metade dos leads que chegam direto pelo WhatsApp. E o cliente
        que esperou e fechou? Provavelmente foi o que tinha menos opção, não o que estava
        mais decidido.
      </p>
      <p>
        <strong>Solução:</strong> automatize as primeiras respostas. As perguntas mais comuns
        em qualquer PME são ~5: horário, preço, localização, disponibilidade, prazo. Uma IA
        responde isso em segundos. O ser humano só entra quando vira conversa de verdade.
      </p>

      <h2>3. Você (ou o atendente) repete a mesma pergunta 20 vezes por dia</h2>
      <p>
        Esse é o sinal mais visível. Se ao final do dia você consegue listar de cabeça as
        5 perguntas que cada cliente fez ("vocês fazem coloração?", "abre sábado?", "tem
        estacionamento?"), você está usando seu cérebro como FAQ.
      </p>
      <p>
        Cada minuto gasto respondendo isso é um minuto que não está atendendo cliente
        complexo, fechando venda grande, ou cuidando da operação. É puro overhead.
      </p>
      <p>
        <strong>Solução:</strong> documente as 10 perguntas mais frequentes do seu negócio.
        Coloque num documento ou no painel do atendente automático. A partir desse momento,
        nenhum humano precisa mais responder essas 10. Libera horas por semana.
      </p>

      <h2>4. Você atende sozinho e está saturado</h2>
      <p>
        Esse é o ponto onde a maioria dos donos de PME chegam: o negócio cresceu, a equipe
        não cresceu junto, e você virou o gargalo. Você que toma decisão, executa o serviço
        e ainda responde WhatsApp.
      </p>
      <p>
        O sintoma claro é: você termina o dia exausto não porque trabalhou na sua atividade-fim,
        mas porque ficou apagando incêndio de comunicação. Cliente perguntando, fornecedor
        cobrando, time pedindo orientação, todos no mesmo WhatsApp.
      </p>
      <p>
        <strong>Solução:</strong> separe canais. WhatsApp pessoal pra equipe e fornecedor.
        WhatsApp do negócio só pra cliente, com atendente automático filtrando. As 80% das
        mensagens que são triviais a IA resolve; só as 20% complexas chegam até você.
      </p>

      <h2>5. Concorrente está respondendo mais rápido que você</h2>
      <p>
        Esse é o sinal final. Se cliente está te perguntando "vi vocês no Google, mas o salão
        Y já me respondeu — vocês conseguem o mesmo preço?", o jogo já é de outra natureza.
        O concorrente não tem necessariamente um negócio melhor; ele só está mais presente
        quando o cliente decidiu comprar.
      </p>
      <p>
        Em mercados saturados (salão, restaurante, academia, e-commerce), a velocidade de
        resposta virou diferencial competitivo real. Não é mais "extra atendimento" — é
        condição mínima.
      </p>
      <p>
        <strong>Solução:</strong> monitore o tempo médio de resposta no seu WhatsApp Business
        (ele mostra essa métrica direto no app). Se está acima de 10 minutos no horário
        comercial e horas fora dele, automatizar não é luxo — é sobrevivência.
      </p>

      <h2>O custo invisível</h2>
      <p>
        O complicado de "perder cliente no atendimento" é que você nunca vê a perda direta.
        Cliente que desistiu não te diz "não compro porque você demorou". Ele simplesmente
        some, e a venda parece nunca ter existido.
      </p>
      <p>
        Por isso a maioria das PMEs não ataca esse problema com a urgência que ele merece.
        Se você se identificou com 2 ou mais sinais acima, vale a pena testar uma solução
        de atendimento automático. Custa menos do que um atendente em meio período, e pega
        100% do volume que está escapando.
      </p>
    </BlogPostShell>
  );
}
