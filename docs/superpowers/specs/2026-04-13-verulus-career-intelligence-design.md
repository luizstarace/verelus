# Verelus — Career Intelligence Platform (Pivot)

**Date:** 2026-04-13
**Status:** SUPERSEDED — substituido pelo pivot Toolbox R$29/mes. Este documento fica arquivado como historico da direcao anterior (Career Intelligence premium R$197-1997/mes). A direcao atual esta no plano `/Users/luizsfap/.claude/plans/dynamic-knitting-adleman.md`.
**Owner:** @luizsfap

---

## Context

O Verelus foi construido como um conjunto de 11 ferramentas geradoras de conteudo com IA (press release, setlist, social posts, contratos, etc). Em producao ja existe:
- Stripe live mode processando pagamentos (R$97 Pro / R$297 Business)
- Supabase Auth (Google + email/senha)
- Deploy no Cloudflare Pages (verelus.com)
- 1 pagamento real registrado (Business, luizsfap@hotmail.com)

**Problema identificado pelo owner:** "as coisas la dentro ainda sao pifeas. os botoes nao funcionam, as conexoes nao funcionam e as ferramentas sao inuteis. gerador de setlist chega a ser piada."

As ferramentas existem mas sao genericas — geram conteudo sem contexto do artista, resultando em outputs superficiais. Nenhum artista pagaria R$297/mes pelo que esta entregue hoje.

**Decisao estrategica:** Pivotar para um produto focado em **inteligencia de carreira profunda e personalizada**. Nao sera mais "ferramentas soltas" — sera uma plataforma que **analisa dados reais do artista, identifica seu estagio de carreira e entrega um diagnostico + plano estrategico de nivel premium** que artistas dos estagios Estabelecido/Referencia pagariam para receber.

**Outcome esperado:** Produto que justifica os novos precos (R$197/497/1997), gera percepcao de valor real, e tem defensibilidade competitiva (nao existe nada assim em portugues brasileiro/LATAM).

---

## Visao e Posicionamento

**Verelus e:** Inteligencia de carreira para artistas independentes em portugues brasileiro/LATAM.

**Tagline de trabalho:** "Descubra em que estagio sua carreira esta — e exatamente o que fazer a seguir."

**O que Verelus nao e:**
- Nao e distribuidor (DistroKid, TuneCore)
- Nao e plataforma de pitch (SubmitHub, Groover)
- Nao e analytics puro (Chartmetric, Soundcharts)
- Nao e um agregador de ferramentas de IA geradoras de conteudo

**O que e de unico:**
Camada de **inteligencia + IA** que cruza dados reais (Spotify API + formulario guiado) com uma framework de estagios de carreira, gerando diagnostico personalizado, analise comparativa contra peers reais brasileiros, benchmark de mercado e plano estrategico de 90 dias — tudo em portugues, com profundidade que hoje so existe em ingles em plataformas que custam USD 200+/mes.

**Target:** Musicos independentes BR/LATAM (solo e banda), do estagio Inicial ao Referencia. Nicho amplo.

---

## Framework de Estagios

5 estagios, nomeados tecnicamente:

| Estagio | Ouvintes mensais | Caracteristicas | Objetivo proximo |
|---------|-----------------|-----------------|------------------|
| **1. Inicial** | < 500 | Primeiro lancamento ou inedito, bio incipiente, sem presenca online consolidada | Lancar primeira obra + construir identidade |
| **2. Emergente** | 500 - 5k | Algumas musicas no Spotify, base local, posta esporadico | Consistencia + primeira base de fas |
| **3. Consolidado** | 5k - 50k | Discografia regular, toca ao vivo, tem regularidade de lancamento | Regionalizacao + monetizacao |
| **4. Estabelecido** | 50k - 500k | Marca definida, shows pagos, engajamento alto, pode viver disso | Escala nacional + entrada na industria |
| **5. Referencia** | 500k+ | Nome conhecido, gravadora/empresariamento, tour regular | Internacionalizacao + longevidade |

O algoritmo de classificacao nao usa so ouvintes — cruza 6 dimensoes (ver Motor de Diagnostico).

---

## Jornada do Usuario

```
1. CRIAR CONTA — ja existe (email/senha + Google OAuth)
      ↓
2. ONBOARDING — 5-8 minutos
   a. Cola URL do Spotify do artista (obrigatorio)
   b. Cola URLs sociais: Instagram, TikTok, YouTube (opcional, pelo menos 1)
   c. Formulario guiado: 10-12 perguntas essenciais
      ↓
3. ANALISE — processamento 60-120s com loading stateful
   - Fetch dados publicos do Spotify
   - Analise de catalogo (audio features de cada musica)
   - Cruzamento com formulario
   - Calculo de estagio
   - Geracao do diagnostico via IA
   - Geracao do plano de 90 dias via IA
   - Benchmark contra peers similares
      ↓
4. DASHBOARD INTERATIVO PREMIUM — o core do produto
   (detalhado na proxima secao)
      ↓
5. REFRESH — plano Pro: 1x/mes; plano Business: ilimitado
   - Atualiza dados do Spotify automaticamente
   - Recalcula estagio
   - Regenera plano e insights
   - Mostra evolucao vs snapshot anterior
```

---

## Dashboard Premium — Estrutura

O dashboard e dividido em 6 modulos, todos na mesma pagina com navegacao lateral ou por abas:

### Modulo 1 — Raio-X Executivo (sempre visivel no topo)
**Visao imediata do estado atual:**
- Card grande: "Voce esta no estagio **Emergente**"
- Score numerico (0-100) com barra de progresso ate o proximo estagio
- 4 metricas-chave em cards: Monthly listeners, Taxa de crescimento mensal, Consistencia de lancamento, Engajamento (followers/listeners ratio)
- **Leitura IA em portugues abaixo de cada numero:** "Seus 3.2k listeners crescem 5% ao mes — no seu estagio, o benchmark e 8%. Voce esta 37% abaixo."

### Modulo 2 — Analise de Catalogo (musica por musica)
**Para cada musica do catalogo do Spotify:**
- Card com capa, titulo, play count
- Audio features visualizados: energia, mood, danceability, valence (radar chart ou bars)
- Tag de posicionamento: "chill indie brasileiro", "electropop energetico", etc (gerada por IA a partir dos audio features + letra)
- Recomendacao concreta: "Pitch em playlists do genero X — 12 matches, 350k alcance potencial"
- Indicador de potencial: "Top 1 do seu catalogo para pitch", "Candidata a single", "Considere remix"

### Modulo 3 — Comparativo com Peers Reais
**Tabela de benchmarking contra artistas brasileiros reais similares:**
- 3-5 artistas escolhidos pela IA baseado em genero + estagio atual + cidade
- Colunas: vocé, Artista A, Artista B, Artista C (monthly listeners, crescimento, frequencia de release, presenca social)
- **Storytelling:** "Lia Souza estava nos seus numeros em 2021. Ela fez isso nos 24 meses seguintes: [timeline de marcos]. Aqui esta o playbook adaptado para voce."
- Base de cases segmentada por genero: indie, rock, MPB, trap, funk, eletronico, etc.

### Modulo 4 — Diagnostico
**Texto estruturado gerado por IA, 400-600 palavras:**
- Paragrafo 1: Por que voce esta no estagio X (analisa dados e respostas do formulario)
- Pontos Fortes (3-4 bullets com detalhamento)
- Pontos de Atencao (3-4 bullets com detalhamento)
- Oportunidades no seu mercado (analise competitiva do estado atual do indie BR)

### Modulo 5 — Plano Estrategico 90 dias
**Lista priorizada de 5-7 acoes concretas:**
Cada acao tem:
- Titulo ("Lance um single em 30 dias")
- Descricao (por que, contexto)
- Impacto esperado (ex: "+15% monthly listeners")
- Prazo sugerido (proximos 7/30/60/90 dias)
- Checkbox de progresso (user marca como feito)
- (v2) Botao "executar com IA" que dispara a ferramenta contextualizada

### Modulo 6 — Export PDF Executivo (Business+)
**PDF de 30-50 paginas gerado sob demanda:**
- Capa personalizada com foto/arte do artista
- Sumario executivo (2 paginas)
- Todos os modulos acima em formato imprimivel
- Apendices: audio features detalhados por musica, benchmarks completos, plano 12-24 meses
- **Usado para:** reuniao com gravadora, apresentacao a booker, pitch para investidor/empresario

---

## Motor de Diagnostico

### Fase 1 — Ingestao de Dados

**Fontes:**
1. **Spotify Web API (Client Credentials flow — nao precisa OAuth do user):**
   - `/artists/{id}` — followers, genres, popularity
   - `/artists/{id}/top-tracks` — top tracks por mercado
   - `/artists/{id}/albums` — catalogo e datas de lancamento
   - `/tracks/{id}/audio-features` — energy, danceability, valence, tempo, acousticness, etc.
   - **Observacao:** monthly listeners nao vem na API publica. Requer scraping da pagina publica do Spotify ou estimativa via popularity score. Decisao de implementacao: tentar scraping; se falhar, usar followers + popularity como proxy.

2. **Formulario guiado (10-12 perguntas):**
   - Ha quanto tempo voce lanca musica? (< 6m / 6-12m / 1-3a / 3-5a / 5+ a)
   - Quantos shows ja fez? (0 / 1-10 / 10-50 / 50-200 / 200+)
   - Voce vive de musica? (nao / parcial / sim)
   - Receita mensal aproximada com musica (R$0 / R$1-2k / R$2-5k / R$5-15k / R$15k+)
   - Voce tem empresario ou gravadora? (nao / tenho parceria / sim tradicional)
   - Frequencia de lancamento (esporadico / a cada 3-6 meses / mensal / semanal)
   - Principal objetivo 12 meses (descoberta / crescer base / monetizar / assinar contrato / internacionalizar)
   - Genero primario (dropdown com generos indie BR/LATAM)
   - Cidade de atuacao
   - Voce tem press kit profissional? (nao / basico / completo)
   - Qualidade media da producao (gravacao caseira / estudio simples / estudio profissional)
   - Tem registro de direitos autorais? (nao / parcial / completo)

3. **URLs sociais (armazenadas; scraping fica para v2).**

### Fase 2 — Calculo de Estagio (deterministico, com regras)

Sistema de pontuacao por 6 dimensoes:

| Dimensao | Peso | Fonte |
|----------|------|-------|
| Audience size | 30% | Monthly listeners + followers Spotify |
| Growth trajectory | 15% | Taxa de crescimento listeners/mes |
| Release consistency | 15% | Frequencia de lancamento (formulario + historico Spotify) |
| Professionalism | 15% | Press kit + qualidade de producao + direitos |
| Revenue/business | 15% | Vive de musica + receita + empresario |
| Multi-platform presence | 10% | Numero de plataformas sociais ativas |

Cada dimensao retorna score 0-100. Media ponderada gera score final:
- 0-20 → Inicial
- 21-40 → Emergente
- 41-60 → Consolidado
- 61-80 → Estabelecido
- 81-100 → Referencia

### Fase 3 — Geracao de Insights (IA)

Claude API recebe:
- Estagio calculado + scores por dimensao
- Dados Spotify brutos (listeners, top tracks, audio features de cada musica)
- Respostas do formulario
- Benchmark data (estatisticas agregadas do estagio atual e proximo)

Gera:
- Diagnostico estruturado (pontos fortes, atencao, oportunidades)
- Plano de 90 dias (5-7 acoes priorizadas com impacto esperado)
- Leituras contextuais para cada numero do dashboard
- Tags de posicionamento para cada musica do catalogo
- Recomendacoes de comparacao (quais artistas brasileiros usar como peers)

**Cache e custo:** Uma analise completa consome ~30-50k tokens de Claude Sonnet (estimado R$0.15-0.30 por analise). Cache por 30 dias; refresh regenera.

### Fase 4 — Benchmark contra Peers Reais

Base de dados curada de **20-30 artistas brasileiros** mapeados por genero + trajetoria historica (criada manualmente no MVP, expande com curadoria):

```
{
  "artist": "Ana Frango Eletrico",
  "genre": ["indie pop", "indie brasileiro"],
  "stage_timeline": [
    {"year": 2018, "monthly_listeners": 3500, "stage": "Emergente", "milestones": ["primeiro single", "show local"]},
    {"year": 2020, "monthly_listeners": 45000, "stage": "Consolidado", "milestones": ["EP completo", "tour regional"]},
    {"year": 2023, "monthly_listeners": 1200000, "stage": "Referencia", "milestones": ["album", "turne internacional", "NPR tiny desk"]}
  ],
  "key_moves": ["Consistencia: 1 lancamento a cada 4 meses", "Estetica visual coesa desde inicio", "Colaboracoes estrategicas no Consolidado"]
}
```

IA escolhe 3-5 peers comparaveis e gera storytelling.

---

## Arquitetura de Dados

### Tabelas novas no Supabase

```sql
-- Dados do artista capturados do Spotify
CREATE TABLE artist_data (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  spotify_artist_id text UNIQUE,
  spotify_url text,
  name text,
  genres text[],
  followers integer,
  popularity integer,
  monthly_listeners integer,
  audio_features_avg jsonb,  -- medias do catalogo
  top_tracks jsonb,
  catalog jsonb,  -- lista de tracks com audio features de cada
  last_synced_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Respostas do formulario guiado
CREATE TABLE artist_survey (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  responses jsonb,  -- dicionario com todas as respostas
  submitted_at timestamp DEFAULT now()
);

-- Diagnosticos gerados
CREATE TABLE diagnostics (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  artist_data_snapshot jsonb,  -- snapshot do artist_data no momento da analise
  survey_snapshot jsonb,
  stage text,  -- "Inicial" | "Emergente" | "Consolidado" | "Estabelecido" | "Referencia"
  stage_score integer,  -- 0-100
  dimension_scores jsonb,  -- {audience, growth, consistency, professionalism, revenue, presence}
  diagnostic_text jsonb,  -- {strengths: [], weaknesses: [], opportunities: []}
  action_plan jsonb,  -- array de acoes com titulo, desc, impacto, prazo
  peer_comparison jsonb,  -- array de peers com dados
  catalog_analysis jsonb,  -- analise por musica
  pdf_url text,  -- se exportado, URL do PDF no storage
  created_at timestamp DEFAULT now()
);

-- Peers brasileiros (base curada manualmente)
CREATE TABLE peer_artists (
  id uuid PRIMARY KEY,
  name text,
  genres text[],
  stage_timeline jsonb,
  key_moves jsonb,
  created_at timestamp DEFAULT now()
);

-- Progresso nas acoes do plano (checkboxes)
CREATE TABLE action_progress (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  diagnostic_id uuid REFERENCES diagnostics(id),
  action_index integer,
  completed boolean DEFAULT false,
  completed_at timestamp
);
```

### Mudancas em tabelas existentes

- `users`: adicionar `plan` enum pode precisar de "enterprise" valor
- `subscriptions`: adicionar produto "enterprise" no mapping
- `artist_profiles`: manter, usado no onboarding

---

## Pricing

| Plan | Preco | O que recebe |
|------|-------|--------------|
| **Free** | R$0 | Raio-X basico (so numeros principais) + estagio identificado. Sem plano, sem analise de catalogo, sem peers. 1 pagina teaser do relatorio. |
| **Pro** | **R$197/mes** | Dashboard executivo completo + Analise de catalogo + Comparativo com peers + Diagnostico + Plano 90 dias + PDF basico + 1 refresh/mes |
| **Business** | **R$497/mes** | Tudo do Pro + refresh ilimitado + Historico de diagnosticos (ver evolucao) + PDF executivo completo (30-50 paginas) + alertas quando indicadores mudam |
| **Enterprise** | **R$1997 one-time OU R$997/mes** | Consultoria humana mensal + PDF custom com branding do artista + acesso antecipado a features. Para artistas Referencia, gravadoras, empresarios. |

**Justificativa de precos:**
- R$197 = menos que 1h de consultoria musical real
- R$497 = preco de um plugin profissional de producao
- R$1997 = 1/10 do que um consultor musical independente cobra por projeto estrategico

---

## Remocoes e Ocultacoes no MVP

**O dashboard atual tem 11 modulos. No MVP, sobram 3:**
- **Home** (dashboard do diagnostico — novo)
- **Perfil** (atualizar dados, socials, refazer survey)
- **Historico** (Business+, ver diagnosticos antigos)

**Modulos escondidos (codigo fica no repo, nao sao deletados, retornam em v1.5):**
- Analysis, Pitching, EPK, Social, Press, Setlist, Budget, Contracts, Reports, Tours

**Justificativa:** Esses modulos hoje geram conteudo generico. Ficam hidden ate v1.5, quando voltam **como acoes executaveis do plano de 90 dias** (contextualizadas com todos os dados do diagnostico).

---

## Roadmap pos-MVP

- **v1.5:** Ferramentas antigas voltam contextualizadas como acoes executaveis do plano
- **v2:** Simulador de cenarios "What if" + AI Career Strategist continuo (insights mensais automaticos)
- **v3:** Pitch Intelligence — analise de musica + recomendacao SubmitHub/Groover com deep links
- **v4:** Scraping e analise de Instagram/TikTok/YouTube (engagement, frequencia, temas)
- **v5:** Consultoria humana mensal integrada ao plano Enterprise

## Backlog de ideias (nao priorizadas ainda)

- **Practice Trainer:** modulo de pratica musical (metronomo inteligente, drill de escalas, play-along). Pode ser integrado ao plano do diagnostico como "pratica diaria recomendada para seu estagio" (ex: artista Inicial → 30min/dia de fundamentos). **Nao copiar produtos existentes** (ex: SBL Academy Groove Trainer) — design e features proprias, inspiracao em conceitos da industria. Considerar so apos v3.

---

## Arquivos Criticos

### A serem criados/modificados

| Arquivo | Funcao |
|---------|--------|
| `src/app/dashboard/page.tsx` | Dashboard principal (hoje e landing do menu de ferramentas, vira o diagnostico) |
| `src/app/dashboard/onboarding/page.tsx` | Novo — formulario guiado + integracao Spotify URL |
| `src/app/dashboard/diagnostic/[id]/page.tsx` | Novo — pagina do diagnostico completo com 6 modulos |
| `src/app/dashboard/catalog/page.tsx` | Novo — analise de catalogo musica por musica |
| `src/app/dashboard/history/page.tsx` | Novo — historico de diagnosticos (Business+) |
| `src/app/api/spotify/fetch-artist/route.ts` | Novo — fetch Spotify Web API (Client Credentials) |
| `src/app/api/spotify/fetch-catalog/route.ts` | Novo — fetch catalog + audio features |
| `src/app/api/diagnostic/generate/route.ts` | Novo — orquestra o motor de diagnostico (regras + Claude) |
| `src/app/api/diagnostic/export-pdf/route.ts` | Novo — gera PDF executivo (Business+) |
| `src/lib/stage-calculator.ts` | Novo — regras de calculo de estagio |
| `src/lib/peer-matcher.ts` | Novo — matching contra peers brasileiros |
| `src/lib/diagnostic-prompts.ts` | Novo — prompts Claude para gerar insights |
| `src/lib/spotify-client.ts` | Novo — cliente Spotify Web API |
| `supabase/migrations/XXX_career_intelligence.sql` | Novo — schema do pivot |
| `src/lib/peer-database.json` | Novo — base curada de 20-30 artistas brasileiros |
| `src/app/page.tsx` | Modificar — landing reflete novo posicionamento + precos |
| `src/app/login/page.tsx` | Manter |

### A serem escondidos (nao deletados)

| Arquivo | Acao |
|---------|------|
| `src/app/dashboard/(tools)/social/*` | Mover para `_archived/` ou marcar como `hidden: true` no nav |
| `src/app/dashboard/(tools)/press/*` | Idem |
| `src/app/dashboard/(tools)/setlist/*` | Idem |
| `src/app/dashboard/(tools)/budget/*` | Idem |
| `src/app/dashboard/(tools)/contracts/*` | Idem |
| `src/app/dashboard/(tools)/reports/*` | Idem |
| `src/app/dashboard/(tools)/tours/*` | Idem |
| `src/app/dashboard/(tools)/analysis/*` | Idem |
| `src/app/dashboard/(tools)/pitching/*` | Idem |
| `src/app/dashboard/(tools)/epk/*` | Idem |

---

## Variaveis de Ambiente Novas

```
# Spotify (Client Credentials flow — server-side only)
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=

# Novos price IDs do Stripe (criaremos)
STRIPE_PRICE_PRO=price_...  # R$197/mes
STRIPE_PRICE_BUSINESS=price_...  # R$497/mes
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...  # R$997/mes
STRIPE_PRICE_ENTERPRISE_ONETIME=price_...  # R$1997 one-time
```

---

## Verificacao / Definition of Done

MVP considerado pronto quando:

1. **Onboarding funciona end-to-end:** usuario novo consegue colar URL Spotify, preencher survey, e submeter em < 8 minutos.
2. **Analise completa em menos de 120 segundos:** do clique em "Gerar diagnostico" ate ver o dashboard.
3. **Dashboard renderiza todos os 6 modulos com dados reais:**
   - Raio-X com 4 metricas + leitura IA
   - Analise de catalogo com todas as musicas do Spotify
   - Comparativo com 3-5 peers brasileiros
   - Diagnostico de 400-600 palavras
   - Plano de 90 dias com 5-7 acoes
   - PDF exportavel (Business+)
4. **Estagio calculado e consistente:** 3 artistas reais distintos (Inicial, Consolidado, Referencia) classificados corretamente em testes manuais.
5. **Pricing novo funciona:** Stripe tem os 4 produtos (Free, Pro R$197, Business R$497, Enterprise R$1997), checkout e upgrade funcionam.
6. **Paywall respeitado:** Free nao acessa analise completa; Pro nao acessa refresh ilimitado nem PDF completo; Business nao acessa consultoria humana.
7. **Ferramentas antigas estao hidden:** dashboard nao mostra Press/Setlist/etc; navegar via URL direta mostra pagina de "Ferramenta em reestruturacao".
8. **Landing page reflete o novo posicionamento** e os novos precos.
9. **Pelo menos 1 artista teste (nao o owner) faz o fluxo completo e aprova a qualidade percebida.**

---

## Estimativa de Esforco

**Timeline:** 4-6 semanas de dev focado.

| Bloco | Dias |
|-------|------|
| Migration do schema + base curada de peers | 1 |
| Cliente Spotify Web API + fetch artist/catalog | 2 |
| Motor de regras (stage calculator) | 2 |
| Prompts + integracao Claude API para diagnostico | 3 |
| Onboarding (formulario guiado + UX polish) | 3 |
| Dashboard modulo 1 (Raio-X) | 2 |
| Dashboard modulo 2 (Analise de Catalogo) | 3 |
| Dashboard modulo 3 (Comparativo Peers) | 2 |
| Dashboard modulo 4 (Diagnostico) | 2 |
| Dashboard modulo 5 (Plano 90 dias + checkboxes) | 2 |
| PDF Export (modulo 6) | 3 |
| Paywall por tier + feature gating | 2 |
| Landing page nova + pricing novo | 2 |
| Stripe novos produtos + migracao | 1 |
| Ocultar modulos antigos + placeholder pages | 1 |
| Testes manuais com 3 artistas reais + polish | 3 |
| **Total** | **~34 dias de dev** |

**Paralelizavel:** Blocos Spotify + Regras + Prompts podem ir em paralelo. Dashboard modulos 1-5 podem ir em paralelo apos onboarding pronto.

---

## Riscos e Mitigacoes

| Risco | Impacto | Mitigacao |
|-------|---------|-----------|
| Monthly listeners nao disponivel via API publica do Spotify | Dado principal do stage calculator | Scraping da pagina publica; se falhar, usar `popularity * followers` como proxy ponderado |
| Base de peers brasileiros limitada no MVP | Comparativo pobre | Comecar com 20-30 artistas mapeados manualmente; expandir iterativo baseado em uso real |
| Custo de Claude API por analise alto | Margem comprimida | Cache 30 dias por diagnostico; Refresh so regenera partes (nao tudo); monitorar custo medio por usuario |
| Artistas Estabelecidos/Referencia nao se sentirem entregues pelo dashboard | Falha do posicionamento premium | Garantir que PDF executivo tem profundidade real; iterar com 2-3 artistas desse estagio antes do lancamento |
| Survey de 10-12 perguntas causa churn no onboarding | Conversao baixa | Progress bar, save incremental, permitir completar depois |
| Usuario nao tem URL do Spotify (caso Inicial) | Bloqueio no onboarding | Oferecer "ainda nao tenho Spotify" -> survey + analise sem dados Spotify, com diagnostico focado em estagio Inicial |

---

## Migracao de Clientes Existentes

**Atualmente so ha 1 pagamento real** (owner, Business R$297). Decisao: migrar manualmente para Enterprise R$997/mes (upgrade, credito proporcional), ou manter grandfathered no preco antigo por 12 meses. **Recomendacao:** grandfathered por 12 meses para o unico customer atual (owner), novos clientes entram no pricing novo.
