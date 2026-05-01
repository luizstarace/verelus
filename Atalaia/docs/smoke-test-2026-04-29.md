# Smoke Test — Atalaia (you-as-customer)

**Data**: 2026-04-29
**Tester**: Luiz (no papel de dono(a) PME 40+ que nunca ouviu falar do produto)
**Duração estimada**: 45 min

## Setup pré-teste

- [ ] Navegador em **janela anônima** (sem login Google, sem cookies, sem extensões)
- [ ] **Celular** (não desktop) — persona 40+ usa mobile pra tudo
- [ ] **Email burner** pronto (ex: `teste.atalaia.YYYYMMDD@duck.com` ou `+atalaia` no Gmail)
- [ ] **2º número de WhatsApp** disponível pra conectar (WhatsApp Beta/2º chip/conta de teste)
- [ ] Notepad/notas físicas pra ir anotando dúvidas em tempo real
- [ ] Cronômetro ligado

## Persona em uso

> "Sou dono(a) de [salão de beleza / clínica / restaurante]. Passei o WhatsApp do salão, recebo umas 30 mensagens por dia. Perco cliente pq às vezes só consigo responder à noite. Vi um anúncio do Atalaia no Instagram. Tô com 7 minutos antes do próximo cliente — vou olhar."

Mantenha essa persona em mente. Você não conhece termos de tech. Você desconfia de IA. Você quer saber: vai funcionar? quanto custa de verdade? cancela fácil?

---

## Etapas (anote travas em cada uma)

### 1. Chegada na landing — `https://atalaia.verelus.com` no mobile

Abra o link, leia HERO sem rolar. Cronometre quanto tempo leva pra entender o que o produto faz.

**Anotações**:
- Tempo até entender (segundos): `___`
- Primeira dúvida que veio: `___`
- Algo confuso de cara: `___`
- **Travas**: 

### 2. Scroll completo da landing — pricing, FAQ, footer

Role até o fim. Foque em: tem prova social? tem garantia? tem como falar com humano antes de assinar?

**Anotações**:
- Quantos segundos pra encontrar preço: `___`
- Achou suporte/contato? `[sim/não]` — onde: `___`
- FAQ responde "e se a IA errar?": `[sim/não]`
- Trust signals visíveis (LGPD, dados BR, número de clientes...): `___`
- **Travas**: 

### 3. Clique "Testar 7 dias grátis"

Cronometre da landing até estar logado.

**Anotações**:
- Pediu cartão? `[sim/não]` — esperava? `___`
- Tela de signup pediu o quê: `___`
- Confirmação de email exigida? `___`
- **Travas**: 

### 4. Setup wizard — Step 1: Dados do negócio

**Anotações**:
- Campos pedidos faziam sentido pra PME comum? `___`
- Algo que faltou perguntar: `___`
- Algo que sobrou (campo que confunde): `___`
- **Travas**: 

### 5. Setup wizard — Step 2: Serviços

**Anotações**:
- Como adiciona serviço — claro? `___`
- Pode editar/remover depois? `___`
- **Travas**: 

### 6. Setup wizard — Step 3: Horários e FAQ

**Anotações**:
- Define horário fácil? Considera feriado/exceção? `___`
- FAQ: o cliente entende que ESSAS são as respostas que a IA vai dar? `___`
- **Travas**: 

### 7. Setup wizard — Step 4: Testar atendente (preview)

**Anotações**:
- Manda 3 mensagens diferentes (saudação, pergunta de horário, pergunta absurda) — IA respondeu coerente?
  - Mensagem 1: `___` → resposta: `___`
  - Mensagem 2: `___` → resposta: `___`
  - Mensagem 3: `___` → resposta: `___`
- Tom soa BR/profissional/PME? `___`
- **Travas**: 

### 8. Setup wizard — Step 5: Conectar WhatsApp

**Anotações**:
- QR aparece rápido? Quanto tempo: `___`
- Instrução clara de como escanear? `___`
- 2º WhatsApp conectou de primeira? `[sim/não]`
- Se errou, mensagem de erro foi útil? `___`
- **Travas**: 

### 9. Mensagem real — número 1 → número conectado

Do seu celular pessoal, manda 3 mensagens pro número conectado:
1. "Oi, vocês atendem hoje?"
2. "Quanto custa um corte?"
3. "Pode me passar pra atendente humana?"

**Anotações**:
- Tempo até resposta da IA (segundos): `___`, `___`, `___`
- Resposta foi útil/correta? `___`
- A 3ª (pedido humano) acionou transferência? `[sim/não]`
- **Travas**: 

### 10. Dashboard — Inbox e overview

**Anotações**:
- Conversa real apareceu no inbox? Em quanto tempo: `___`
- "Trial expira em X dias" visível em algum lugar? `___`
- Consegue mandar resposta humana de dentro do dashboard? `___`
- **Travas**: 

### 11. Tentar cancelar / sair

**Anotações**:
- Achou onde cancelar? Em quantos cliques: `___`
- O processo é amigável ou tenta segurar? `___`
- Avisa o que acontece com os dados? `___`
- **Travas**: 

### 12. Email — checar se chegou algo

**Anotações**:
- Email de boas-vindas chegou? Quanto tempo: `___`
- Tom do email casa com o produto? `___`
- Tem CTA útil ou é genérico? `___`
- **Travas**: 

---

## Lista consolidada de travas

Compile aqui as travas anotadas acima, com prioridade:

- **P0 (bloqueia uso)**: cliente não consegue prosseguir sem ajuda
- **P1 (confunde mas dá pra seguir)**: cliente atravessa, mas com dúvida ou frustração
- **P2 (cosmético)**: detalhe que polish melhora mas não impede

| # | Etapa | Trava | Prioridade | Arquivo provável |
|---|---|---|---|---|
| 1 |   |   |   |   |
| 2 |   |   |   |   |
| 3 |   |   |   |   |
| 4 |   |   |   |   |
| 5 |   |   |   |   |

---

## Notas finais

**Tempo total real**: `___` min

**Sentimento geral pós-teste** (1 frase como persona PME):

> "___"

**3 melhorias de maior impacto** (na sua opinião como engenheiro):

1. ___
2. ___
3. ___

**Algo que te SURPREENDEU positivamente** (manter, não deixar regredir):

- ___

---

**Próximo passo**: trazer este doc preenchido pra próxima sessão. Eu codifico os fixes P0/P1 priorizados.
