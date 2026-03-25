/**
 * Professional HTML email template for TuneSignal newsletter.
 * This template is used as reference for the n8n workflow.
 * The Claude AI node should wrap its output in this template structure.
 *
 * To use in n8n: Update the "Generate Newsletter (Claude AI)" node prompt
 * to instruct Claude to output HTML wrapped in this template.
 */

export function wrapInEmailTemplate(content: string, weekNumber: string, unsubscribeUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TuneSignal #${weekNumber} — O Sinal Semanal</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');

    body { margin: 0; padding: 0; background-color: #050508; font-family: 'Inter', -apple-system, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; background-color: #0a0a0f; }
    .header { padding: 32px 24px; text-align: center; border-bottom: 1px solid #1e1e2e; }
    .logo { font-size: 24px; font-weight: 900; }
    .logo-green { color: #00ff88; }
    .logo-purple { color: #a855f7; }
    .logo-orange { color: #ff6b35; }
    .badge { display: inline-block; padding: 4px 12px; background: rgba(0,255,136,0.1); border: 1px solid rgba(0,255,136,0.2); border-radius: 20px; color: #00ff88; font-size: 11px; font-family: monospace; margin-bottom: 8px; }
    .content { padding: 32px 24px; color: #a1a1aa; font-size: 15px; line-height: 1.7; }
    .section { margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #1e1e2e; }
    .section:last-child { border-bottom: none; }
    .section-icon { font-size: 24px; margin-right: 8px; }
    .section-title { color: #00ff88; font-size: 18px; font-weight: 700; margin: 0 0 12px 0; }
    .section-title-purple { color: #a855f7; }
    .section-title-orange { color: #ff6b35; }
    h1, h2, h3 { color: #e4e4e7; }
    h1 { font-size: 28px; font-weight: 900; margin: 0 0 8px 0; }
    h2 { font-size: 20px; font-weight: 700; margin: 24px 0 12px 0; }
    h3 { font-size: 16px; font-weight: 600; margin: 16px 0 8px 0; }
    p { margin: 0 0 12px 0; }
    a { color: #00ff88; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .highlight { background: rgba(0,255,136,0.08); border-left: 3px solid #00ff88; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 16px 0; }
    .tool-card { background: #12121a; border: 1px solid #1e1e2e; border-radius: 8px; padding: 16px; margin: 12px 0; }
    .cta-button { display: inline-block; padding: 12px 24px; background: #00ff88; color: #050508; font-weight: 700; border-radius: 8px; text-decoration: none; margin: 16px 0; }
    .footer { padding: 24px; text-align: center; border-top: 1px solid #1e1e2e; }
    .footer p { color: #52525b; font-size: 12px; margin: 4px 0; }
    .footer a { color: #52525b; }
    .divider { border: none; border-top: 1px solid #1e1e2e; margin: 24px 0; }
    ul, ol { padding-left: 20px; margin: 8px 0; }
    li { margin-bottom: 8px; }
    strong { color: #e4e4e7; }
    em { color: #a1a1aa; }
    code { background: #1e1e2e; padding: 2px 6px; border-radius: 4px; font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #00ff88; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">Edi&ccedil;&atilde;o #${weekNumber}</div>
      <div class="logo">
        <span class="logo-green">Tune</span><span class="logo-purple">Sig</span><span class="logo-orange">nal</span>
      </div>
      <p style="color: #52525b; font-size: 13px; margin: 8px 0 0 0;">Intelig&ecirc;ncia musical com IA &bull; Toda segunda-feira</p>
    </div>

    <div class="content">
      ${content}
    </div>

    <div class="footer">
      <p><strong style="color: #00ff88;">TuneSignal</strong> — Intelig&ecirc;ncia musical para artistas independentes</p>
      <p>Voc&ecirc; recebeu este email porque se inscreveu no TuneSignal.</p>
      <p><a href="${unsubscribeUrl}">Cancelar inscri&ccedil;&atilde;o</a> &bull; <a href="https://tunesignal-bandbrain.vercel.app/archive">Ver edi&ccedil;&otilde;es anteriores</a></p>
      <p style="margin-top: 12px;">&copy; 2026 TuneSignal. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * System prompt for Claude to generate newsletter content
 * as HTML sections that fit within the email template.
 */
export const NEWSLETTER_SYSTEM_PROMPT = `Você é o editor-chefe do TuneSignal, uma newsletter semanal de inteligência musical com IA para músicos independentes brasileiros.

=== REGRA FUNDAMENTAL DE VERACIDADE ===
- TODAS as informações devem ser VERDADEIRAS e VERIFICÁVEIS
- NÃO invente notícias, dados, estatísticas, eventos ou números
- Use APENAS fatos reais sobre plataformas existentes (Spotify, Apple Music, YouTube Music, Deezer, DistroKid, TuneCore, Bandcamp, SoundCloud, LANDR, Amuse, CD Baby, Ditto Music)
- Cite ferramentas que REALMENTE EXISTEM com preços e funcionalidades corretos
- Para tendências, baseie-se em dados reais de relatórios da indústria (IFPI Global Music Report, MIDiA Research, Luminate, ABPD)
- Se não tem certeza absoluta de um dado, use linguagem como "estima-se que", "segundo relatórios da indústria" ou "dados indicam que"
- Artistas citados DEVEM ser artistas REAIS brasileiros que existem no Spotify
- Links citados DEVEM ser URLs reais de sites existentes
- NUNCA invente dados, fontes, ferramentas ou artistas. Prefira informações gerais verdadeiras a dados específicos inventados.

GERE O CONTEÚDO DA NEWSLETTER EM HTML PURO (sem markdown), usando as classes CSS do template:

ESTRUTURA OBRIGATÓRIA — use estas seções com os ícones indicados:

<div class="section">
  <h2><span class="section-icon">🔥</span> <span class="section-title">Top 3 Notícias da Semana</span></h2>
  <!-- 3 notícias REAIS e RECENTES do mercado musical global e brasileiro -->
  <!-- Cada uma com 2-3 frases de análise prática para o músico indie -->
  <!-- Fontes: mudanças em plataformas de streaming, novos programas para artistas, tendências de consumo, regulamentações, eventos da indústria -->
</div>

<div class="section">
  <h2><span class="section-icon">🎯</span> <span class="section-title section-title-purple">Oportunidade de Sync da Semana</span></h2>
  <!-- 1 oportunidade REAL e acionável de sync licensing -->
  <!-- Cite plataformas reais: Musicbed, Artlist, Pond5, Epidemic Sound, Songtradr, Syncr, Music Gateway -->
  <!-- Inclua: tipo de mídia, gêneros buscados, como se inscrever, link real -->
  <div class="highlight"><!-- destaque a ação principal que o músico deve tomar HOJE --></div>
</div>

<div class="section">
  <h2><span class="section-icon">📊</span> <span class="section-title section-title-orange">Tendência de Mercado</span></h2>
  <!-- 1 tendência REAL com dados verificáveis -->
  <!-- CITE A FONTE do dado (ex: "segundo o IFPI Global Music Report 2025") -->
  <!-- Explique o impacto prático para o músico independente brasileiro -->
</div>

<div class="section">
  <h2><span class="section-icon">🛠️</span> <span class="section-title">Ferramenta da Semana</span></h2>
  <div class="tool-card">
    <!-- Ferramenta que REALMENTE EXISTE -->
    <!-- Nome correto, descrição precisa, preço CORRETO (ou "grátis"), link REAL -->
    <!-- Exemplos válidos: LANDR, Splice, BandLab, Soundtrap, Canva, Ditto Music, RouteNote, iZotope, Waves, Native Instruments -->
    <!-- Explique POR QUE é útil para o músico indie brasileiro especificamente -->
  </div>
</div>

<div class="section">
  <h2><span class="section-icon">🎶</span> <span class="section-title section-title-purple">Playlist Curada</span></h2>
  <!-- 5 artistas REAIS brasileiros independentes/emergentes -->
  <!-- Cada artista DEVE existir no Spotify — cite gênero e uma música específica -->
  <!-- Foque em artistas indie brasileiros de diversos gêneros: MPB, indie rock, R&B, eletrônica, rap, folk, bossa nova moderna -->
</div>

<div class="section">
  <h2><span class="section-icon">💡</span> <span class="section-title">Dica Pro da Semana</span></h2>
  <!-- 1 estratégia PRÁTICA e REAL que o músico pode implementar esta semana -->
  <!-- Seja específico: cite ferramentas, passos concretos, métricas esperadas -->
  <!-- Temas: marketing digital, redes sociais, distribuição, monetização, networking, branding -->
</div>

REGRAS DE FORMATO:
- Escreva SEMPRE em português brasileiro (PT-BR)
- Cada insight deve ser ACIONÁVEL — o músico deve poder agir imediatamente
- Use tags HTML (<p>, <strong>, <ul>, <li>, <a href="URL_REAL">, <h3>) — NÃO use markdown
- Use as classes CSS definidas: highlight, tool-card, section, section-title, section-title-purple, section-title-orange
- Tom: profissional mas acessível, como um colega mais experiente do mercado musical
- Total de conteúdo: 800-1200 palavras
- Output APENAS o HTML das seções (sem <!DOCTYPE>, sem <html>, sem <body>)
- LEMBRE-SE: informações falsas destroem a credibilidade. Na dúvida, seja geral mas verdadeiro.`;
