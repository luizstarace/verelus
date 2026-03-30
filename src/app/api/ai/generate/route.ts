import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";


export const runtime = 'edge';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ═══════════════════════════════════════════════════════════════════
// BANDBRAIN PREMIUM AI ENGINE — Professional-grade prompts
// Each prompt is designed to produce content worth the subscription
// ═══════════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `You are BandBrain, an elite AI band manager and music industry strategist. You combine the expertise of:
- A top-tier music publicist with 20+ years experience
- A social media marketing director at a major label
- A live music booking agent and tour manager
- A sync licensing consultant who has placed music in major films/TV
- A data-driven music business analyst

You work exclusively with independent artists, mostly from Brazil but also globally.
You understand the Brazilian music market deeply — Spotify Brasil dynamics, sync opportunities in Brazilian TV/film (Globo, Netflix BR, Amazon BR), the indie scene in São Paulo, Rio, BH, Curitiba, etc.

CRITICAL RULES:
- Always respond in Brazilian Portuguese (PT-BR) unless explicitly asked otherwise
- Be SPECIFIC — never give generic advice. Use real platform names, real strategies, real numbers
- Every output must be IMMEDIATELY ACTIONABLE — the musician should be able to use it right away
- Include concrete examples, templates, and step-by-step instructions
- Reference current industry trends and platforms (2025-2026)
- Adapt everything to the artist's specific genre, stage, and context
- Format output beautifully with clear sections, using markdown headers and bullet points
- Be encouraging but honest — give real industry advice, not motivational fluff`;

type PromptGenerator = (band: string, genre: string, ctx: string, lang: string) => string;

const PROMPTS: Record<string, PromptGenerator> = {
  social_calendar: (band, genre, ctx, lang) => `
Crie um CALENDÁRIO DE CONTEÚDO COMPLETO de 30 dias para "${band}" (gênero: ${genre}).

${ctx ? `CONTEXTO IMPORTANTE DO ARTISTA: ${ctx}` : ""}

REQUISITOS OBRIGATÓRIOS — cada dia DEVE conter:

1. **Número do dia + Dia da semana sugerido**
2. **Plataforma principal**: Instagram (Reels, Stories, Carrossel, Post), TikTok, Twitter/X, YouTube Shorts
3. **Tipo de conteúdo**: Especifique exatamente (ex: "Reel de 15s com transição", "Carrossel de 5 slides", "Thread de 7 tweets")
4. **Legenda COMPLETA pronta para copiar e colar** — com emojis, tom autêntico, CTA claro
5. **Hashtags estratégicas** (5-8, mix de volume alto e nicho)
6. **Horário ideal de postagem** (baseado em dados de engajamento para ${genre} no Brasil)
7. **Dica de produção**: Como filmar/criar aquele conteúdo específico (equipamento, app, filtro)

ESTRUTURA DO MÊS:
- **Semana 1**: Engajamento e conexão com fãs existentes
- **Semana 2**: Discovery — conteúdo para alcançar novos ouvintes
- **Semana 3**: Autoridade — posicionar como referência no gênero
- **Semana 4**: Conversão — direcionar para streaming/shows/merch

PILARES DE CONTEÚDO (distribua equilibradamente):
- 🎬 Behind the scenes (processo criativo, ensaio, estúdio) — 25%
- 🎵 Teasers musicais (trechos, covers criativos, mashups) — 25%
- 💬 Engajamento direto (enquetes, Q&A, challenges, collabs) — 20%
- 📖 Storytelling (história da banda, inspirações, conquistas) — 15%
- 📢 Promoção direta (releases, shows, links) — 15%

REGRAS DE OURO:
- Nunca repita o mesmo formato dois dias seguidos
- Inclua pelo menos 3 conteúdos "viralizable" (trends, duetos, challenges)
- Toda semana deve ter 1 conteúdo que convide colaboração com outros artistas
- Use ganchos fortes nos primeiros 3 segundos de cada Reel/TikTok
- Adapte a linguagem ao público de ${genre} brasileiro
- Inclua métricas de referência (ex: "Este tipo de reel costuma ter 2-5x mais alcance")

BÔNUS — Inclua no final:
- Lista de 10 sons/trends do momento que funcionam para ${genre}
- 5 contas para seguir e interagir estrategicamente
- Template de bio otimizada para cada plataforma
`.trim(),

  press_release: (band, genre, ctx, lang) => `
Escreva um PRESS RELEASE PROFISSIONAL completo para "${band}" (gênero: ${genre}).

${ctx ? `CONTEXTO: ${ctx}` : "A banda está lançando música nova."}

FORMATO EXATO DE UM PRESS RELEASE PROFISSIONAL DA INDÚSTRIA:

---

**[HEADLINE — Impactante, em caixa alta, máx 15 palavras]**

**[SUBHEADLINE — Complementa o headline com um ângulo editorial]**

**[CIDADE, ESTADO — DATA]** — [Parágrafo de abertura: Quem + O quê + Quando + Por que importa. Máximo 3 frases. Deve capturar a atenção de um jornalista em 5 segundos.]

[Parágrafo 2: O CONTEXTO — Situe este lançamento no contexto da carreira do artista e da cena musical atual. Conecte com tendências maiores da indústria. Por que AGORA?]

[Parágrafo 3: DETALHES ARTÍSTICOS — O processo criativo. Quem produziu, onde foi gravado, quais referências. Cite detalhes específicos que um jornalista pode transformar em matéria.]

**"[CITAÇÃO DO ARTISTA — Pessoal, autêntica, emocional. Não genérica. Deve soar como uma pessoa real falando.]"** — [Nome], [papel na banda]

[Parágrafo 4: DADOS E CREDENCIAIS — Números de streaming, shows relevantes, prêmios, selos, playlists em que já estiveram. Se não tiver, foque em marcos da comunidade.]

[Parágrafo 5: INFORMAÇÕES DE LANÇAMENTO — Data, onde ouvir, formatos disponíveis, links relevantes.]

**SOBRE ${band.toUpperCase()}**
[Boilerplate bio de 3-4 frases. Origens, estilo, influências, conquistas principais.]

**CONTATO PARA IMPRENSA:**
[Nome] — [Email] — [Telefone]
[Website] | [Instagram] | [Spotify]

**ASSETS PARA IMPRENSA:**
[Link para fotos em alta resolução]
[Link para EPK (Electronic Press Kit)]
[Link para ouvir o lançamento em preview]

---

REQUISITOS ADICIONAIS:
1. Escreva como um publicista profissional — tom sério mas apaixonado
2. Evite clichês como "revolucionário", "inovador", "único" — use linguagem específica
3. A citação do artista deve soar REAL, não fabricada
4. Inclua 3 ângulos que um jornalista poderia usar para escrever uma matéria
5. Formate para fácil copiar/colar — pronto para envio
6. Inclua uma versão CURTA (3 parágrafos) para pitch por email
7. Inclua sugestão de ASSUNTO DE EMAIL para o pitch (3 opções)
8. Liste 10 veículos de mídia brasileiros relevantes para ${genre} com contatos genéricos
`.trim(),

  setlist: (band, genre, ctx, lang) => `
Crie uma ESTRATÉGIA DE SETLIST PROFISSIONAL para "${band}" (gênero: ${genre}).

${ctx ? `CONTEXTO DO SHOW: ${ctx}` : "Um show headline de 60 minutos em casa noturna."}

ENTREGUE TRÊS SETLISTS COMPLETAS:

## SETLIST 1: "O SHOW PERFEITO" (headline, 60 min)
## SETLIST 2: "O SET MATADOR" (abertura/festival, 30 min)
## SETLIST 3: "O ACÚSTICO ÍNTIMO" (sessão acústica, 45 min)

PARA CADA SETLIST, INCLUA:

### Estrutura Detalhada:
Para cada slot de música, forneça:
| # | Slot | Energia (1-10) | BPM Sugerido | Tom | Duração | Notas de Transição |
|---|------|----------------|-------------|-----|---------|-------------------|

### Arco Emocional do Show:
- Descreva a curva de energia do início ao fim
- Marque os momentos de "pico" e "vale" intencionais
- Explique a psicologia por trás de cada transição

### Estratégia de Abertura (Primeiros 3 minutos):
- Como capturar a atenção IMEDIATAMENTE
- Elementos de palco (iluminação, som, visual)
- O que NÃO fazer na abertura

### Dinâmica do Meio do Set:
- Quando desacelerar e por quê
- O momento ideal para falar com o público
- Como manter engagement se a energia cair

### Estratégia de Encerramento:
- A sequência final de 3 músicas (a "trifeta")
- Estratégia de encore (fazer ou não? quando?)
- Como fechar para que o público saia querendo mais

### Interações com o Público:
- 3-5 momentos planejados de interação
- Frases/histórias sugeridas para entre músicas
- Quando pedir palmas, cantar junto, etc.

### Checklist Técnico:
- Sugestão de rider técnico simplificado
- Ordem de soundcheck baseada no setlist
- Backup plan se equipamento falhar

### Dicas de Performance para ${genre}:
- Movimentação de palco específica para o gênero
- Erros comuns em shows de ${genre} e como evitar
- 5 truques de palco que artistas de ${genre} usam

### Métricas de Sucesso:
- Como medir se o setlist funcionou
- Sinais do público para ajustar em tempo real
- Adaptações para público quente vs frio
`.trim(),

  playlist_pitch: (band, genre, ctx, lang) => `
Crie um KIT COMPLETO DE PITCH PARA PLAYLISTS para "${band}" (gênero: ${genre}).

${ctx ? `CONTEXTO: ${ctx}` : "Pitching o último lançamento."}

ENTREGUE TUDO ABAIXO — PRONTO PARA USAR:

---

## 1. PITCH PARA SPOTIFY FOR ARTISTS (Editorial)
Preencha EXATAMENTE no formato que o Spotify pede:

**Song description** (máx 500 caracteres):
[Escreva a descrição perfeita — gênero, humor, instrumentação, história]

**What's the mood?** [Selecione de: Chill, Energetic, Happy, Sad, Romantic, Dark, etc.]
**What's the style?** [Ex: Acoustic, Electronic, Live band, etc.]
**What instruments?** [Liste]
**What era/culture?** [Ex: 2020s Brazilian indie, etc.]
**Anything else Spotify should know?** (máx 500 caracteres):
[O pitch interno — por que esta música merece atenção editorial]

---

## 2. EMAILS PARA CURADORES INDEPENDENTES

### Versão CURTA (para curadores ocupados — máx 5 frases):
**Assunto:** [3 opções de subject line com open rates estimados]
[Email completo pronto para enviar]

### Versão MÉDIA (para curadores engajados):
**Assunto:** [3 opções]
[Email com contexto + história + CTA]

### Versão LONGA (para blogs/editoriais):
**Assunto:** [3 opções]
[Pitch completo com narrativa editorial]

---

## 3. MENSAGEM PARA DM (Instagram/Twitter)
[Versão ultra-curta para abordagem por DM — casual mas profissional]

---

## 4. LISTA DE PLAYLISTS-ALVO

### Playlists Editoriais do Spotify BR relevantes para ${genre}:
| Playlist | Seguidores (aprox) | Fit Score | Como Submeter |
|----------|-------------------|-----------|---------------|

### Playlists Independentes (curadores ativos em ${genre}):
| Curador/Playlist | Seguidores | Plataforma | Contato |
|-----------------|------------|------------|---------|
[10 playlists reais e ativas]

### Playlists do Apple Music / Deezer / YouTube Music:
[5 opções em cada plataforma]

---

## 5. ESTRATÉGIA DE TIMING
- Melhor dia/hora para submeter ao Spotify editorial
- Quantas semanas antes do lançamento submeter
- Cronograma de follow-up (quando e como)
- Quando NÃO fazer pitch

## 6. O QUE NÃO FAZER
- 10 erros fatais que artistas cometem ao fazer pitch
- Exemplos de emails que curadores ODEIAM
- Red flags que fazem seu pitch ser ignorado

## 7. MÉTRICAS DE ACOMPANHAMENTO
- Como rastrear se seu pitch funcionou
- KPIs para medir sucesso de playlist placement
- Template de planilha para tracking de pitches
`.trim(),

  monthly_report: (band, genre, ctx, lang) => `
Crie um RELATÓRIO MENSAL DE ESTRATÉGIA COMPLETO para "${band}" (gênero: ${genre}).

${ctx ? `DADOS ADICIONAIS: ${ctx}` : ""}

GERE UM RELATÓRIO PROFISSIONAL COM ESTAS SEÇÕES:

---

# RELATÓRIO MENSAL DE ESTRATÉGIA — ${band.toUpperCase()}
**Período:** [Mês Atual] 2026
**Preparado por:** BandBrain AI

---

## 1. RESUMO EXECUTIVO
- Visão geral do mês em 3 pontos
- Maior conquista a celebrar
- Maior oportunidade perdida a corrigir
- Meta principal para o próximo mês

## 2. ANÁLISE DE MÉTRICAS

### Streaming (Spotify / Apple Music / Deezer):
| Métrica | Meta Sugerida | Benchmark ${genre} | Como Medir |
|---------|--------------|-------------------|------------|
| Ouvintes Mensais | [meta realista] | [benchmark] | Spotify for Artists |
| Streams Totais | [meta] | [benchmark] | Spotify for Artists |
| Save Rate | [meta %] | [benchmark %] | Spotify for Artists |
| Playlist Adds | [meta] | [benchmark] | Spotify for Artists |
| Discovery Mode ROI | [meta] | [benchmark] | Spotify Dashboard |

### Redes Sociais:
| Plataforma | Meta Seguidores | Meta Engagement Rate | Benchmark ${genre} |
|-----------|----------------|---------------------|-------------------|
| Instagram | [meta] | [meta %] | [benchmark] |
| TikTok | [meta] | [meta %] | [benchmark] |
| YouTube | [meta] | [meta %] | [benchmark] |
| Twitter/X | [meta] | [meta %] | [benchmark] |

### Email & Comunidade:
| Métrica | Meta | Como Melhorar |
|---------|------|--------------|
| Lista de emails | [meta] | [tática] |
| Open rate | [meta %] | [tática] |
| Click rate | [meta %] | [tática] |

## 3. ANÁLISE DA CONCORRÊNCIA
- 5 artistas similares em ${genre} no Brasil para monitorar
- O que estão fazendo de certo
- Oportunidades que eles estão ignorando (e você pode pegar)
- Ferramentas para monitorar competidores (Chartmetric, Soundcharts, etc.)

## 4. OPORTUNIDADES DO MÊS

### Sync Licensing:
- 3 oportunidades específicas de sync para ${genre} no Brasil
- Briefings abertos em music libraries
- Como se cadastrar nas principais plataformas de sync
- Valor médio de licenciamento para artistas indie em ${genre}

### Shows & Eventos:
- Eventos/festivais relevantes nos próximos 60 dias
- Como se candidatar / quem contatar
- Estratégia de pricing para cachê

### Colaborações:
- 5 artistas para propor feat/collab (com justificativa estratégica)
- Como abordar cada um
- Formato de collab mais eficiente para ${genre}

## 5. PLANO DE AÇÃO — PRÓXIMOS 30 DIAS

### Esta Semana (Quick Wins):
- [ ] [Ação 1 — implementável em 1 hora]
- [ ] [Ação 2 — implementável em 1 hora]
- [ ] [Ação 3 — implementável em 1 hora]

### Semana 2:
- [ ] [Ação de médio esforço]
- [ ] [Ação de médio esforço]

### Semana 3:
- [ ] [Ação estratégica]
- [ ] [Ação estratégica]

### Semana 4:
- [ ] [Review e ajuste]
- [ ] [Preparação para próximo mês]

## 6. FINANÇAS & MONETIZAÇÃO
- Estimativa de receita por fonte (streaming, shows, merch, sync)
- Oportunidades de monetização inexploradas para ${genre}
- Investimentos sugeridos (ads, equipamento, registro de obras)
- ROI esperado de cada investimento

## 7. FERRAMENTAS RECOMENDADAS
| Ferramenta | Uso | Preço | Por que |
|-----------|-----|-------|---------|
[5-8 ferramentas específicas para ${genre} indie]

## 8. TENDÊNCIAS DA INDÚSTRIA
- 3 tendências de ${genre} para ficar de olho
- Como cada tendência afeta artistas independentes
- Ação concreta para surfar cada tendência

---

**Próximo relatório:** [Data sugerida]
**Ação mais urgente:** [Destaque em negrito]
`.trim(),
};

export async function POST(req: NextRequest) {
  try {
    const { type, bandName, genre, context: ctx, lang } = await req.json();

    if (!type || !bandName || !genre) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const promptFn = PROMPTS[type];
    if (!promptFn) {
      return NextResponse.json({ error: "Invalid module type" }, { status: 400 });
    }

    const userLang = lang || "pt";
    const prompt = promptFn(bandName, genre, ctx || "", userLang);

    // Call Claude API with system prompt for consistent quality
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Claude API error:", response.status, errorData);
      return NextResponse.json(
        { error: "AI generation failed. Please try again." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || "No content generated";
    const tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

    // Log to Supabase for analytics
    try {
      await supabase.from("ai_outputs").insert({
        type,
        status: "completed",
        input_data: { bandName, genre, context: ctx },
        output_content: content,
        tokens_used: tokensUsed,
      });
    } catch (logErr) {
      console.error("Failed to log AI output:", logErr);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      content,
      tokensUsed,
      module: type,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("AI generate error:", err);
    return NextResponse.json(
      { error: "Failed to generate content. Please try again." },
      { status: 500 }
    );
  }
}
