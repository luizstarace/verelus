# Fase 1 Quick Wins — Nivelamento das 11 Ferramentas

## Contexto

Apos auditoria profunda das 11 ferramentas do Verelus, o scorecard medio e 6.5/10. Tres ferramentas ja sao fortes (Cache 8/10, Release Timing 8/10, Content Calendar 8/10) e uma e fraca (Checklist 5/10). O restante esta entre 6-7/10.

O objetivo desta fase: **nivelar TODAS as 11 ferramentas pra 7/10+** com mudancas focadas em UX, feedback visual e conteudo explicativo. Nenhuma mudanca arquitetural grande — apenas adicoes de componentes compartilhados e aplicacao consistente em cada ferramenta.

**Por que nivelar (nao turbinar)?** Um produto com 4 ferramentas fortes e 7 mediocres perde usuarios nas mediocres. Um bundle de 11 ferramentas consistentemente boas (7/10) vale mais que 3 excelentes + 8 mediocres.

Filosofia reforcada: "Nos menores frascos estao os melhores perfumes" — nao vamos adicionar features novas, vamos polir o que ja existe.

## Novos Componentes UI

Expandir `src/components/ui/` com 4 novos componentes (ja temos ErrorMessage, LoadingSpinner, EmptyState, ConfirmModal, InputModal):

### `<Toast>` — notificacao nao-bloqueante
- Singleton via `useToast()` hook + `<ToastContainer>` no dashboard layout
- Auto-dismiss em 2s
- Variantes: `success` / `error` / `info`
- Posicao: top-right
- Uso: confirmar copy, save, delete

```tsx
const toast = useToast();
toast.success('Bio copiada!');
```

### `<HelpTooltip>` — icone `?` com explicacao
- Recebe `content: string | ReactNode` como prop
- Estado open/close interno (click pra abrir, click fora pra fechar)
- Mobile-friendly (toca pra abrir/fechar, nao depende de hover)
- Uso: explicar termos tecnicos (cache, break-even, exclusividade, MRR)

```tsx
<label>Cache <HelpTooltip content="Cache e o valor garantido pelo venue..." /></label>
```

### `<PresetSelector>` — botoes pra pre-preencher formularios
- Recebe `presets: Array<{ label: string; values: Record<string, any> }>`
- Dispara `onSelect(values)` que o pai aplica ao form
- Render: linha de botoes clicaveis acima do form
- Uso: Cache (Solo/Banda 5/Producao), Metas (templates)

```tsx
<PresetSelector
  presets={[
    { label: 'Solo', values: { musicians: 1, ... } },
    { label: 'Banda 5', values: { musicians: 5, ... } },
  ]}
  onSelect={(v) => setForm({ ...form, ...v })}
/>
```

### `<CharCounter>` — contador com cores por threshold
- Recebe `current: number` e `max: number`
- Renderiza `{current}/{max}` com cor condicional:
  - `< 80%` → brand-muted (cinza)
  - `80-95%` → yellow-400
  - `> 95%` → orange-400
- Uso: output de Bio (Spotify 300 char, Instagram 150 char, Twitter 280 char)

## Mudancas por Ferramenta

### 1. Bio Adaptativa
- **Toast** ao copiar cada bio
- **CharCounter** no output de cada bio (ja tem calculo, melhorar display)
- Clarificar label "influencia nao-obvia" com exemplos concretos (Wong Kar-wai, Clarice Lispector, Arvo Part)
- **HelpTooltip** em cada tom explicando diferenca (formal vs casual vs poetico vs edgy)

### 2. Calculadora de Cache
- **PresetSelector** no topo: "Solo" / "Duo" / "Banda 5" / "Producao full"
- **HelpTooltip** em "cache" e "break-even"
- Tier 1/2/3 com exemplos de cidades inline ("Tier 1: SP, RJ, BH... Tier 2: capitais...")
- Mostrar formula do break-even abaixo do resultado

### 3. Rider Tecnico
- Modal de preview do stage plot ANTES de gerar PDF
- Undo/redo no StagePlotEditor (historico via array de estados)
- Campo "observacao" por equipamento (aparece num popup ao clicar no item)

### 4. Contrato de Show
- **HelpTooltip** em cada clausula com "O que e? / Quando usar?"
- Modal de preview do contrato antes de gerar PDF final
- Toggles pra remover clausulas opcionais (exclusividade, gravacao)

### 5. Pitch Kit
- **Novo campo no output:** `email_subject` (gerado pelo Claude)
- Preview do recipient type ANTES de gerar ("Pitch pra curador vai enfatizar: streams, playlist fits. Pitch pra jornalista: storytelling, contexto")
- **Toast** ao copiar cada peca

### 6. Quando Lancar
- Renomear goal types:
  - "Viral hit" → "Entrar em playlists editoriais"
  - "Steady growth" → "Construir fanbase leal"
  - "Fan release" → "Expandir territorio/alcance"
- Destacar as 3 datas recomendadas no calendario grid com fundo verde

### 7. Checklist de Lancamento
- Descricoes expandiveis em cada item (what/why/how)
- **HelpTooltip** em termos tecnicos
- Tags visuais: [critico] (vermelho) / [importante] (amarelo) / [opcional] (cinza)
- Link cross-tool: items relacionados a pitch tem botao "Abrir Pitch Kit"

### 8. Growth Tracker
- Badge "Atualize seu IG/TikTok" quando ultima update > 7 dias
- Melhorar insight diagnostic: em vez de "YouTube cresceu 12%" → "YouTube +12% — o que aconteceu? Video viral? Colaboracao?"
- Toggle escala logaritmica no chart (pra artistas com numeros pequenos nao sumirem)

### 9. Comparador de Concorrentes
- Help text ao adicionar: "Escolha artistas 2-5x seu tamanho no seu genero. Evite superestrelas; olhe pra quem chegou no proximo nivel que voce quer."
- Nova coluna na tabela: "Crescimento/sem" (delta calculado de snapshots)
- Insight comparativo: "Artista X cresce 5%/sem. Voce 2%. Gap: 3pp"

### 10. Meta Tracker
- **PresetSelector** de metas comuns:
  - "5k Spotify em 6 meses (artista emergente)"
  - "10k Instagram em 3 meses"
  - "1k YouTube subs em 6 meses"
- Explicar thresholds: "on_track = 80%+ do ritmo necessario"
- Benchmarks por estagio (texto informativo acima do form)

### 11. Cronograma de Posts
- Janela customizavel: selector "15 dias / 30 dias / 60 dias" antes de gerar
- Card expandivel explicando estrategia por fase (Teaser/Curiosidade/Preview/Countdown/Lancamento/Pos)
- Editar caption inline no resultado (textarea em vez de texto fixo, atualiza state local)

## Conteudo Estatico Centralizado

Criar `src/lib/tool-content.ts` com:

```typescript
export const HELP_TEXTS = {
  cache: "Cache e o valor garantido que o venue paga pro artista, independente de bilheteria...",
  breakEven: "Break-even e o ponto onde suas despesas igualam a receita...",
  exclusivity: "Clausula de exclusividade impede o artista de tocar as mesmas musicas em venues concorrentes...",
  // ... ~15 termos
};

export const CACHE_PRESETS = [
  { label: 'Solo', values: { musicians: 1, gear_cost: 200, ... } },
  { label: 'Duo', values: { musicians: 2, ... } },
  { label: 'Banda 5', values: { musicians: 5, ... } },
  { label: 'Producao full', values: { musicians: 6, lighting: true, ... } },
];

export const GOAL_BENCHMARKS = {
  spotify_listeners: {
    emerging: '2-5k/mes em 6 meses',
    growing: '10-20k/mes em 6 meses',
    // ...
  },
  // ...
};

export const CLAUSE_HELP = {
  cancellation: { what: "...", when: "...", example: "..." },
  // ...
};
```

**Por que centralizar:** facilita revisao pelo usuario (advogado pode revisar CLAUSE_HELP), iteracao sem mexer em JSX, e tipagem consistente.

## Arquitetura e Estado

### Principios

- Componentes UI **sao puros** (stateless ou self-contained)
- Conteudo estatico em `tool-content.ts`, importado onde usado
- Toast via singleton hook (`useToast()`) + container no layout do dashboard

### Mudancas de estado por ferramenta

**Pitch Kit** — `email_subject` novo campo no `PitchOutput`:
- Atualizar `src/lib/types/tools.ts`
- Atualizar prompt em `src/lib/pitch-kit-prompt.ts` pra pedir o campo
- Atualizar parser pra validar
- Atualizar `PitchKitClient.tsx` pra mostrar no output

**Cronograma** — caption editing local:
- Novo state `editedCaptions: Record<number, string>` no `ContentCalendarClient`
- Ao digitar, atualiza state local (nao re-gera via API)
- Copy button usa versao editada se existir

**Rider** — undo/redo no stage plot:
- State de historico: `history: StageItem[][]`, `historyIndex: number`
- Qualquer mudanca adiciona snapshot ao historico
- Undo = `historyIndex--`, Redo = `historyIndex++`

## Testes

**Ja temos:** 67 testes vitest passando.

**Novos testes necessarios:**
- `src/__tests__/components/Toast.test.tsx` — render, variantes, auto-dismiss depois de 2s
- `src/__tests__/components/HelpTooltip.test.tsx` — abre/fecha no click, fecha ao clicar fora
- `src/__tests__/components/CharCounter.test.tsx` — cor muda conforme threshold
- `src/__tests__/lib/tool-content.test.ts` — valida que as constantes estao populadas e tipadas corretamente

**Nao vamos testar nesta fase:**
- Fluxo E2E das ferramentas (isso fica pra Fase 6 manual)
- PresetSelector (trivial o bastante que uso manual cobre)

## Escopo Explicito

### Fora desta fase (sera outra fase)
- Integracoes cross-tool complexas (Release Timing → Checklist → Calendar como fluxo unico) — Fase 3
- Email/notificacao real pra Growth Tracker (reminder semanal de update) — Fase 4
- PDFs com branding visual no Pitch Kit (design grafico) — Fase 3
- Integracao com Google Calendar, Buffer, Hootsuite — Fase 4
- Export CSV nos trackers — Fase 2

### Restricoes

- **Nao alterar APIs existentes** — todas as mudancas sao no frontend OU adicoes ao prompt do Pitch Kit (novo campo, nao altera contrato)
- **Nao adicionar novas dependencias npm** — todos os componentes com Tailwind + React nativo
- **Manter 0 erros TypeScript + 67 testes passando** como linha de base

## Verificacao

Esta fase esta completa quando:

1. Os 4 novos componentes UI (`Toast`, `HelpTooltip`, `PresetSelector`, `CharCounter`) existem em `src/components/ui/` e tem testes unitarios passando
2. `src/lib/tool-content.ts` existe com HELP_TEXTS, CACHE_PRESETS, GOAL_BENCHMARKS, CLAUSE_HELP populados
3. Cada uma das 11 ferramentas tem pelo menos:
   - 1 `<Toast>` em acao relevante (copy/save)
   - Pelo menos 1 `<HelpTooltip>` em termo tecnico (exceto as que nao tem termos tecnicos)
   - As mudancas especificas listadas na secao "Mudancas por Ferramenta"
4. Pitch Kit tem `email_subject` gerado e exibido no output
5. Rider tem undo/redo funcional no StagePlotEditor
6. Cronograma permite editar caption inline
7. 0 erros TypeScript, >= 71 testes passando (67 atuais + 4 novos)
8. Review manual cada ferramenta — scorecard >= 7/10 em cada

## Arquivos Criticos a Modificar

### Criar
- `src/components/ui/Toast.tsx` + `useToast.ts` hook
- `src/components/ui/HelpTooltip.tsx`
- `src/components/ui/PresetSelector.tsx`
- `src/components/ui/CharCounter.tsx`
- `src/lib/tool-content.ts`
- 4 arquivos de teste em `src/__tests__/components/` e `src/__tests__/lib/`

### Modificar (clients das 11 ferramentas)
- `src/app/dashboard/bio/BioClient.tsx`
- `src/app/dashboard/cache-calculator/CacheClient.tsx`
- `src/app/dashboard/rider/RiderClient.tsx` + `src/components/rider/StagePlotEditor.tsx`
- `src/app/dashboard/contract/ContractClient.tsx`
- `src/app/dashboard/pitch-kit/PitchKitClient.tsx`
- `src/app/dashboard/release-timing/ReleaseTimingClient.tsx`
- `src/app/dashboard/launch-checklist/ChecklistClient.tsx`
- `src/app/dashboard/growth/GrowthClient.tsx`
- `src/app/dashboard/competitors/CompetitorsClient.tsx`
- `src/app/dashboard/goals/GoalsClient.tsx`
- `src/app/dashboard/content-calendar/ContentCalendarClient.tsx`

### Modificar (layout pra Toast container)
- `src/app/dashboard/layout.tsx` (adicionar `<ToastContainer />`)

### Modificar (Pitch Kit backend)
- `src/lib/types/tools.ts` (adicionar `email_subject` em `PitchOutput`)
- `src/lib/pitch-kit-prompt.ts` (prompt + parser)
