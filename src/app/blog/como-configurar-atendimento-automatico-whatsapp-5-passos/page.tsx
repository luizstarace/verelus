import type { Metadata } from 'next';
import Link from 'next/link';
import { BlogPostShell } from '../_components/BlogPostShell';
import { getPostBySlug } from '../posts';

const meta = getPostBySlug('como-configurar-atendimento-automatico-whatsapp-5-passos')!;

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
        Configurar um atendente automático no WhatsApp parece complicado, mas é um daqueles
        projetos que rendem mais por hora investida do que quase qualquer outra coisa que
        você pode fazer no seu negócio. Bem feito, libera 1-2 horas do seu dia. Mal feito,
        irrita seus clientes e te faz desistir.
      </p>
      <p>
        Este guia entrega o caminho prático em 5 passos. Vale para qualquer PME — salão,
        clínica, restaurante, prestador de serviço — e foi escrito assumindo que você não
        sabe programar e tem 30 a 60 minutos para investir no setup.
      </p>

      <h2>Passo 1: mapear o que vale a pena automatizar</h2>
      <p>
        Antes de escolher ferramenta, entenda o que precisa automatizar. Pegue uma folha
        e responda: <strong>quais são as 10 perguntas que clientes mais te fazem no WhatsApp?</strong>
      </p>
      <p>
        Algumas que aparecem em quase toda PME:
      </p>
      <ul>
        <li>"Vocês atendem em qual horário?"</li>
        <li>"Quanto custa o serviço X?"</li>
        <li>"Atende no bairro Y / faz delivery em Z?"</li>
        <li>"Tem horário disponível pra hoje / amanhã?"</li>
        <li>"Aceita pagamento parcelado?"</li>
      </ul>
      <p>
        Essas 10 perguntas representam tipicamente <strong>70% a 90% do volume de mensagens
        do seu WhatsApp</strong>. São o alvo principal da automação. Tudo que sai disso
        (negociação, reclamação, decisão complexa) você ainda atende como humano.
      </p>
      <p>
        Não pule esse passo. Sem o mapeamento, a IA não tem o que responder e você acaba
        com um robô genérico que frustra mais que ajuda.
      </p>

      <h2>Passo 2: escolher a ferramenta</h2>
      <p>
        Existem três caminhos:
      </p>
      <ol>
        <li>
          <strong>WhatsApp Business app puro:</strong> mensagens automáticas básicas (saudação,
          ausência), etiquetas. É grátis, mas só cobre saudação inicial — não responde
          perguntas reais.
        </li>
        <li>
          <strong>Plataforma DIY com Cloud API:</strong> Make/Zapier + ChatGPT API +
          WhatsApp Cloud API. Funciona, mas exige tempo técnico e manutenção contínua.
        </li>
        <li>
          <strong>SaaS pronto pra PME:</strong> ferramentas como o{' '}
          <Link href="/atalaia">Atalaia</Link> que entregam o pacote completo com setup
          de poucos minutos.
        </li>
      </ol>
      <p>
        Para a maioria das PMEs, o caminho 3 é o que se paga sozinho mais rápido. Se você
        tem perfil técnico e tempo, o 2 é viável. O 1 só funciona pra negócios com volume
        baixo (menos de 10 mensagens/dia).
      </p>
      <p>
        Critérios para escolher:
      </p>
      <ul>
        <li>Tem trial grátis com cartão zero? (Se exige cartão, fuja.)</li>
        <li>Setup leva minutos ou dias? (Mais de 1 hora já é demais pra MVP.)</li>
        <li>Suporta o WhatsApp via QR (sem precisar API oficial cara)?</li>
        <li>Você consegue ajustar respostas erradas no painel sem chamar suporte?</li>
        <li>Cobra por mensagem ou por mês fixo? (Fixo é mais previsível.)</li>
      </ul>

      <h2>Passo 3: conectar o WhatsApp</h2>
      <p>
        Existem duas formas de conectar o WhatsApp do seu negócio na ferramenta:
      </p>
      <ul>
        <li>
          <strong>Via QR Code (Evolution API ou similar):</strong> abre seu WhatsApp Web
          conectando a um chip dedicado. Setup em 30 segundos. Cuidado: se o chip ficar
          offline (celular descarregado), o atendente para de funcionar.
        </li>
        <li>
          <strong>Via WhatsApp Business Cloud API (oficial Meta):</strong> mais robusto, mas
          tem aprovação da Meta e custo por mensagem. Vale para volume alto (1000+ msgs/mês)
          ou negócio que não pode arriscar offline.
        </li>
      </ul>
      <p>
        <strong>Use um número dedicado.</strong> Não conecte seu WhatsApp pessoal. Compre
        um chip pré-pago de R$ 30 ou use um SIM virtual (eSIM). A IA não deve responder
        seus parentes nem ver suas conversas privadas.
      </p>

      <h2>Passo 4: cadastrar as informações do negócio</h2>
      <p>
        Agora você cadastra o que descobriu no Passo 1. Cada plataforma tem um painel com
        campos como:
      </p>
      <ul>
        <li><strong>Nome do negócio</strong> e categoria (salão, clínica, etc.)</li>
        <li><strong>Endereço</strong> completo + bairro + região de atuação</li>
        <li><strong>Horários de funcionamento</strong> por dia da semana</li>
        <li><strong>Lista de serviços</strong> com nome, preço e duração</li>
        <li><strong>FAQ</strong> com as 10 perguntas que você mapeou + respostas</li>
      </ul>
      <p>
        Quanto mais detalhado, melhor a IA responde. Não economize aqui — seus clientes vão
        perceber a diferença entre "não temos essa informação" e "sim, fazemos coloração no
        sábado, leva 3 horas, custa R$ 250 e tem horário livre às 10h e 14h".
      </p>
      <p>
        <strong>Dica importante:</strong> escreva como você fala, não como em folder de
        marketing. A IA vai aprender o tom. Se você usa "amor" e "querida" com clientes,
        coloque isso. Se é mais formal, mantém formal.
      </p>

      <h2>Passo 5: testar antes de ir ao ar</h2>
      <p>
        Quase ninguém faz esse passo direito, e é onde a maioria dos atendentes automáticos
        falha em produção. <strong>Antes de conectar com clientes reais</strong>, peça pra
        2-3 amigos mandarem mensagens de teste de outros números.
      </p>
      <p>
        Roteiro mínimo de teste:
      </p>
      <ul>
        <li>Pergunta básica do FAQ ("Qual o horário?")</li>
        <li>Pergunta com erro de digitação ("vcs aprovaram cartao em 6x?")</li>
        <li>Pergunta fora do roteiro ("posso pagar com Pix em 5 vezes?")</li>
        <li>Pergunta enrolada com 3 dúvidas juntas ("vocês atendem amanhã, fazem coloração, quanto sai")</li>
        <li>Pedido de transferência ("quero falar com o dono")</li>
      </ul>
      <p>
        Anote onde a IA errou. Volta no painel, ajusta a resposta correspondente, repete o
        teste. Em 3-4 ciclos a maioria dos casos comuns está coberto.
      </p>

      <h2>Erros comuns para evitar</h2>
      <ul>
        <li>
          <strong>Cadastrar info incompleta esperando que a IA "resolva":</strong> ela não
          adivinha. Se o preço não está cadastrado, ela vai inventar ou não responder.
        </li>
        <li>
          <strong>Não definir limites claros:</strong> a IA precisa saber quando transferir.
          Cancelamentos, reclamações sérias, negociações de preço grandes — sempre humano.
        </li>
        <li>
          <strong>Esquecer de monitorar nas primeiras semanas:</strong> 80% dos ajustes acontecem
          nos primeiros 14 dias de uso real. Olha o painel todo dia inicialmente.
        </li>
        <li>
          <strong>Não atualizar quando muda preço/serviço:</strong> a IA vai continuar respondendo
          o valor antigo. Ajustar leva 30 segundos no painel.
        </li>
      </ul>

      <h2>Quanto tempo total isso leva</h2>
      <p>
        Realista: <strong>40 a 90 minutos para o setup inicial</strong>, dependendo de quantos
        serviços e FAQs você tem. Mais 2-3 horas distribuídas nas duas primeiras semanas
        ajustando o que a IA erra na prática.
      </p>
      <p>
        Compare com o tempo que você gasta hoje respondendo as mesmas 10 perguntas várias
        vezes por dia. A conta fecha rapidamente.
      </p>
    </BlogPostShell>
  );
}
