import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';
import type { ContractInput, ContractParty } from '@/lib/types/tools';

// Paleta (mesma do Rider para consistencia visual)
const COLOR_ACCENT = rgb(0.0, 0.96, 0.63);
const COLOR_TEXT = rgb(0.13, 0.13, 0.13);
const COLOR_MUTED = rgb(0.45, 0.45, 0.45);
const COLOR_LIGHT_BORDER = rgb(0.85, 0.85, 0.85);
const COLOR_DISCLAIMER_BG = rgb(1.0, 0.96, 0.88);
const COLOR_DISCLAIMER_BORDER = rgb(0.85, 0.55, 0.1);

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 55;

interface DrawContext {
  pdf: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  fontBold: PDFFont;
  cursorY: number;
}

function newPage(ctx: DrawContext): DrawContext {
  const page = ctx.pdf.addPage([PAGE_W, PAGE_H]);
  return { ...ctx, page, cursorY: PAGE_H - MARGIN };
}

function ensureSpace(ctx: DrawContext, needed: number): DrawContext {
  if (ctx.cursorY - needed < MARGIN + 30) return newPage(ctx);
  return ctx;
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  if (!text) return [''];
  const lines: string[] = [];
  for (const rawLine of text.split('\n')) {
    if (!rawLine.trim()) {
      lines.push('');
      continue;
    }
    const words = rawLine.split(/\s+/);
    let current = '';
    for (const word of words) {
      const candidate = current ? current + ' ' + word : word;
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

function drawParagraph(ctx: DrawContext, text: string, opts: { size?: number; bold?: boolean; leading?: number; indent?: number } = {}): DrawContext {
  const size = opts.size ?? 10;
  const leading = opts.leading ?? 1.5;
  const font = opts.bold ? ctx.fontBold : ctx.font;
  const x = MARGIN + (opts.indent ?? 0);
  const maxWidth = PAGE_W - MARGIN - x;
  const lines = wrapText(text, font, size, maxWidth);
  let c = ctx;
  for (const line of lines) {
    c = ensureSpace(c, size * leading);
    if (line) {
      c.page.drawText(line, { x, y: c.cursorY - size, size, font, color: COLOR_TEXT });
    }
    c = { ...c, cursorY: c.cursorY - size * leading };
  }
  return c;
}

function drawSectionTitle(ctx: DrawContext, title: string): DrawContext {
  let c = ensureSpace(ctx, 28);
  c = { ...c, cursorY: c.cursorY - 10 };
  c.page.drawRectangle({
    x: MARGIN,
    y: c.cursorY - 14,
    width: 4,
    height: 14,
    color: COLOR_ACCENT,
  });
  c.page.drawText(title.toUpperCase(), {
    x: MARGIN + 10,
    y: c.cursorY - 11,
    size: 11,
    font: c.fontBold,
    color: COLOR_TEXT,
  });
  return { ...c, cursorY: c.cursorY - 22 };
}

function drawDivider(ctx: DrawContext): DrawContext {
  let c = ensureSpace(ctx, 12);
  c.page.drawLine({
    start: { x: MARGIN, y: c.cursorY - 4 },
    end: { x: PAGE_W - MARGIN, y: c.cursorY - 4 },
    thickness: 0.4,
    color: COLOR_LIGHT_BORDER,
  });
  return { ...c, cursorY: c.cursorY - 14 };
}

function formatCurrency(cents: number): string {
  const value = cents / 100;
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso: string): string {
  if (!iso) return '___/___/______';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function formatDateLong(iso: string): string {
  if (!iso) return 'data a definir';
  const date = new Date(iso + 'T12:00:00');
  if (isNaN(date.getTime())) return iso;
  const months = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
}

function describeParty(party: ContractParty, role: string): string {
  const docLabel = party.type === 'pj' ? 'CNPJ' : 'CPF';
  const nameLabel = party.type === 'pj' ? 'pessoa juridica' : 'pessoa fisica';
  const rep = party.type === 'pj' && party.representative
    ? `, neste ato representada por ${party.representative}${party.representative_document ? ` (CPF ${party.representative_document})` : ''}`
    : '';
  return `${role.toUpperCase()}: ${party.name}, ${nameLabel}, inscrita no ${docLabel} sob o numero ${party.document}, com endereco na ${party.address_street}, ${party.address_city}/${party.address_state}, CEP ${party.address_zip}${rep}.`;
}

function duration_text(min: number): string {
  if (min < 60) return `${min} minutos`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h${m}min`;
}

function recordingText(rule: ContractInput['recording_allowed']): string {
  switch (rule) {
    case 'prohibited':
      return 'Fica vedada qualquer gravacao audio ou audiovisual do show, exceto uso pessoal e privado pelo publico presente.';
    case 'personal_only':
      return 'Fica permitida a gravacao apenas para uso pessoal e nao comercial por parte do publico presente. Gravacoes profissionais e transmissoes dependem de autorizacao expressa do CONTRATADO.';
    case 'promo_with_credit':
      return 'O CONTRATANTE pode gravar trechos do show para uso promocional em suas redes sociais e materiais de divulgacao, desde que credite o CONTRATADO de forma visivel.';
    case 'full_rights':
      return 'O CONTRATANTE fica autorizado a gravar o show integralmente e utilizar as gravacoes para fins promocionais em suas proprias plataformas, creditando o CONTRATADO.';
  }
}

function paymentMethodText(m: ContractInput['payment_method']): string {
  switch (m) {
    case 'pix': return 'PIX';
    case 'transfer': return 'transferencia bancaria';
    case 'cash': return 'pagamento em dinheiro';
    case 'boleto': return 'boleto bancario';
  }
}

function balanceTimingText(t: ContractInput['balance_due_timing']): string {
  switch (t) {
    case 'before_show': return 'ate 3 dias antes do show';
    case 'on_show_day': return 'no dia do show, antes do inicio da apresentacao';
    case 'after_show': return 'ate 5 dias uteis apos o show';
  }
}

function drawDisclaimer(ctx: DrawContext): DrawContext {
  let c = ensureSpace(ctx, 70);
  const boxY = c.cursorY - 58;
  c.page.drawRectangle({
    x: MARGIN,
    y: boxY,
    width: PAGE_W - 2 * MARGIN,
    height: 58,
    color: COLOR_DISCLAIMER_BG,
    borderColor: COLOR_DISCLAIMER_BORDER,
    borderWidth: 0.8,
  });
  c.page.drawText('IMPORTANTE — MODELO GENERICO', {
    x: MARGIN + 10,
    y: boxY + 42,
    size: 9,
    font: c.fontBold,
    color: COLOR_DISCLAIMER_BORDER,
  });
  const discText = 'Este contrato e um modelo profissional, amplamente aceito no mercado musical brasileiro. Para shows de alto valor, situacoes envolvendo direitos autorais complexos ou disputas com risco juridico elevado, recomenda-se revisao por advogado proprio. A Verelus nao se responsabiliza por adequacao legal a cada caso especifico.';
  const lines = wrapText(discText, c.font, 8, PAGE_W - 2 * MARGIN - 20);
  let yPos = boxY + 30;
  for (const line of lines) {
    c.page.drawText(line, { x: MARGIN + 10, y: yPos, size: 8, font: c.font, color: COLOR_TEXT });
    yPos -= 10;
  }
  return { ...c, cursorY: boxY - 14 };
}

export async function generateContractPDF(input: ContractInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdf.embedFont(StandardFonts.TimesRomanBold);

  pdf.setTitle(`Contrato de Show - ${input.artist.name}`);
  pdf.setAuthor(input.artist.name);
  pdf.setSubject('Contrato de Prestacao de Servicos Artisticos');
  pdf.setCreator('Verelus');

  const firstPage = pdf.addPage([PAGE_W, PAGE_H]);
  let ctx: DrawContext = { pdf, page: firstPage, font, fontBold, cursorY: PAGE_H - MARGIN };

  // ========== CAPA / TITULO ==========
  ctx.page.drawText('CONTRATO DE PRESTACAO', {
    x: MARGIN,
    y: ctx.cursorY - 16,
    size: 10,
    font: fontBold,
    color: COLOR_MUTED,
  });
  ctx = { ...ctx, cursorY: ctx.cursorY - 28 };

  ctx.page.drawText('DE SERVICOS ARTISTICOS', {
    x: MARGIN,
    y: ctx.cursorY - 24,
    size: 22,
    font: fontBold,
    color: COLOR_TEXT,
  });
  ctx = { ...ctx, cursorY: ctx.cursorY - 36 };

  // Barra accent
  ctx.page.drawRectangle({
    x: MARGIN,
    y: ctx.cursorY - 4,
    width: 80,
    height: 3,
    color: COLOR_ACCENT,
  });
  ctx = { ...ctx, cursorY: ctx.cursorY - 20 };

  // ========== DISCLAIMER ==========
  ctx = drawDisclaimer(ctx);

  // ========== QUALIFICACAO DAS PARTES ==========
  ctx = drawSectionTitle(ctx, 'Das partes');
  ctx = drawParagraph(ctx, describeParty(input.contractor, 'Contratante'), { size: 10, leading: 1.5 });
  ctx = { ...ctx, cursorY: ctx.cursorY - 6 };
  ctx = drawParagraph(ctx, describeParty(input.artist, 'Contratado'), { size: 10, leading: 1.5 });
  ctx = { ...ctx, cursorY: ctx.cursorY - 4 };
  ctx = drawParagraph(ctx,
    'As partes, acima qualificadas, tem entre si justo e contratado o presente Contrato de Prestacao de Servicos Artisticos, que se regera pelas clausulas e condicoes a seguir:',
    { size: 10, leading: 1.5 }
  );
  ctx = drawDivider(ctx);

  // ========== CLAUSULA 1 — OBJETO ==========
  ctx = drawSectionTitle(ctx, 'Clausula 1 — Do objeto');
  const openingText = input.has_opening_act && input.opening_act_name
    ? ` A atracao de abertura sera: ${input.opening_act_name}.`
    : '';
  ctx = drawParagraph(ctx,
    `O CONTRATADO se obriga a realizar apresentacao artistica para o CONTRATANTE no dia ${formatDateLong(input.show_date)}, com inicio previsto as ${input.show_time}, com duracao aproximada de ${duration_text(input.show_duration_min)}. A apresentacao ocorrera em ${input.venue_name}, localizado em ${input.venue_address}. O evento e caracterizado como: ${input.event_type}.${openingText}`,
    { size: 10, leading: 1.5 }
  );
  ctx = drawDivider(ctx);

  // ========== CLAUSULA 2 — CACHE E PAGAMENTO ==========
  ctx = drawSectionTitle(ctx, 'Clausula 2 — Do cache e condicoes de pagamento');
  const cacheFormatted = formatCurrency(input.cache_total);
  const depositValue = formatCurrency(Math.round(input.cache_total * input.deposit_percent / 100));
  const balanceValue = formatCurrency(input.cache_total - Math.round(input.cache_total * input.deposit_percent / 100));

  let paymentText = `Pela prestacao dos servicos descritos na Clausula 1, o CONTRATANTE pagara ao CONTRATADO o cache total de ${cacheFormatted}, a ser pago via ${paymentMethodText(input.payment_method)}.`;

  if (input.deposit_percent > 0 && input.deposit_percent < 100) {
    paymentText += ` O pagamento sera realizado em duas parcelas: (i) sinal de ${input.deposit_percent}% (${depositValue}) pago na assinatura deste contrato${input.deposit_due_date ? ` ou ate ${formatDate(input.deposit_due_date)}, o que ocorrer primeiro` : ''}; (ii) saldo remanescente de ${balanceValue}, ${balanceTimingText(input.balance_due_timing)}.`;
  } else if (input.deposit_percent === 100) {
    paymentText += ` O valor integral sera pago na assinatura deste contrato.`;
  } else {
    paymentText += ` O valor integral sera pago ${balanceTimingText(input.balance_due_timing)}.`;
  }
  ctx = drawParagraph(ctx, paymentText, { size: 10, leading: 1.5 });
  ctx = { ...ctx, cursorY: ctx.cursorY - 4 };
  ctx = drawParagraph(ctx,
    'O nao cumprimento do prazo de pagamento acarretara em juros de 1% ao mes, pro rata die, alem de multa de 2% sobre o valor em atraso.',
    { size: 10, leading: 1.5 }
  );
  ctx = drawDivider(ctx);

  // ========== CLAUSULA 3 — OBRIGACOES DO CONTRATANTE ==========
  ctx = drawSectionTitle(ctx, 'Clausula 3 — Das obrigacoes do Contratante');
  const responsibilities: string[] = [];
  if (input.provides_equipment) responsibilities.push('fornecer todo equipamento tecnico conforme rider anexo a este contrato (som, iluminacao, palco, backline quando aplicavel)');
  if (input.provides_transport) responsibilities.push('arcar com o transporte do CONTRATADO e sua equipe para o local do show, bem como o retorno');
  if (input.provides_accommodation) responsibilities.push('fornecer hospedagem adequada para o CONTRATADO e sua equipe na cidade do evento, quando aplicavel');
  if (input.provides_meals) responsibilities.push('fornecer alimentacao para o CONTRATADO e sua equipe no dia do show');
  if (input.provides_security) responsibilities.push('garantir a seguranca do CONTRATADO, sua equipe, equipamentos e do publico durante todo o evento');
  if (input.provides_promotion) responsibilities.push('realizar a devida divulgacao do evento, sendo vedada a utilizacao da imagem do CONTRATADO em contexto diverso do ora acordado');
  responsibilities.push('cumprir com o prazo de passagem de som acordado com antecedencia');
  responsibilities.push('garantir a conformidade do local quanto a alvaras e autorizacoes necessarias');

  ctx = drawParagraph(ctx,
    'Sao obrigacoes do CONTRATANTE, alem de outras previstas neste instrumento:',
    { size: 10, leading: 1.5 }
  );
  for (let i = 0; i < responsibilities.length; i++) {
    ctx = drawParagraph(ctx, `(${i + 1}) ${responsibilities[i]};`, { size: 10, leading: 1.45, indent: 10 });
  }
  ctx = drawDivider(ctx);

  // ========== CLAUSULA 4 — OBRIGACOES DO CONTRATADO ==========
  ctx = drawSectionTitle(ctx, 'Clausula 4 — Das obrigacoes do Contratado');
  const artistObligations = [
    'comparecer no local e no horario ajustados, com antecedencia minima de 2 (duas) horas para passagem de som',
    'realizar a apresentacao com a qualidade artistica e tecnica compativel com sua reputacao profissional',
    'respeitar o horario de duracao acordado na Clausula 1',
    'responsabilizar-se pelos direitos autorais e conexos de sua obra, incluindo eventuais recolhimentos ao ECAD quando aplicavel',
    'informar previamente ao CONTRATANTE sobre qualquer alteracao de equipe ou formacao',
  ];
  ctx = drawParagraph(ctx, 'Sao obrigacoes do CONTRATADO:', { size: 10, leading: 1.5 });
  for (let i = 0; i < artistObligations.length; i++) {
    ctx = drawParagraph(ctx, `(${i + 1}) ${artistObligations[i]};`, { size: 10, leading: 1.45, indent: 10 });
  }
  ctx = drawDivider(ctx);

  // ========== CLAUSULA 5 — CANCELAMENTO ==========
  ctx = drawSectionTitle(ctx, 'Clausula 5 — Do cancelamento');
  ctx = drawParagraph(ctx,
    `Em caso de cancelamento do show por qualquer das partes, serao aplicadas as seguintes multas sobre o valor total do cache:`,
    { size: 10, leading: 1.5 }
  );
  ctx = drawParagraph(ctx, `(1) cancelamento com mais de 30 dias de antecedencia: multa de ${input.cancel_fee_more_30_days}% do valor do cache;`, { size: 10, leading: 1.45, indent: 10 });
  ctx = drawParagraph(ctx, `(2) cancelamento entre 7 e 30 dias de antecedencia: multa de ${input.cancel_fee_7_to_30_days}% do valor do cache;`, { size: 10, leading: 1.45, indent: 10 });
  ctx = drawParagraph(ctx, `(3) cancelamento com menos de 7 dias de antecedencia: multa de ${input.cancel_fee_less_7_days}% do valor do cache.`, { size: 10, leading: 1.45, indent: 10 });
  ctx = { ...ctx, cursorY: ctx.cursorY - 4 };
  ctx = drawParagraph(ctx,
    'Nao serao consideradas cancelamento as situacoes de forca maior comprovada (catastrofes naturais, decretos governamentais, problemas graves de saude dos envolvidos), caso em que as partes tentarao, de boa-fe, remarcar o show em data compativel sem aplicacao de multa.',
    { size: 10, leading: 1.5 }
  );
  ctx = drawDivider(ctx);

  // ========== CLAUSULA 6 — IMAGEM E GRAVACAO ==========
  ctx = drawSectionTitle(ctx, 'Clausula 6 — Dos direitos de imagem e gravacao');
  ctx = drawParagraph(ctx, recordingText(input.recording_allowed), { size: 10, leading: 1.5 });
  if (input.streaming_allowed) {
    ctx = drawParagraph(ctx,
      'Fica autorizada a transmissao ao vivo (streaming) do show, total ou parcial, pelo CONTRATANTE, desde que com creditos apropriados ao CONTRATADO.',
      { size: 10, leading: 1.5 }
    );
  }
  if (input.image_rights_for_promo) {
    ctx = drawParagraph(ctx,
      'O CONTRATADO autoriza o CONTRATANTE a utilizar sua imagem e nome para divulgacao especifica deste evento, em materiais impressos e digitais. Esta autorizacao nao se estende a outros eventos ou finalidades comerciais diversas.',
      { size: 10, leading: 1.5 }
    );
  }
  ctx = drawDivider(ctx);

  // ========== CLAUSULA 7 — EXCLUSIVIDADE ==========
  if (input.has_exclusivity && input.exclusivity_radius_km && input.exclusivity_days_before) {
    ctx = drawSectionTitle(ctx, 'Clausula 7 — Da exclusividade geografica');
    ctx = drawParagraph(ctx,
      `O CONTRATADO se compromete a nao realizar apresentacoes em um raio de ${input.exclusivity_radius_km}km da cidade do evento, pelo periodo de ${input.exclusivity_days_before} dias anteriores a data do show. Esta clausula tem por objetivo preservar o publico do evento.`,
      { size: 10, leading: 1.5 }
    );
    ctx = drawDivider(ctx);
  }

  // ========== CLAUSULA 8 — CLAUSULAS EXTRAS ==========
  if (input.extra_clauses && input.extra_clauses.trim().length > 0) {
    ctx = drawSectionTitle(ctx, 'Clausula adicional — Disposicoes especificas');
    ctx = drawParagraph(ctx, input.extra_clauses, { size: 10, leading: 1.5 });
    ctx = drawDivider(ctx);
  }

  // ========== CLAUSULA FINAL — FORO ==========
  ctx = drawSectionTitle(ctx, 'Clausula final — Do foro');
  ctx = drawParagraph(ctx,
    `As partes elegem o foro da Comarca de ${input.forum_city}/${input.forum_state} como competente para dirimir quaisquer questoes oriundas deste contrato, com renuncia a qualquer outro, por mais privilegiado que seja.`,
    { size: 10, leading: 1.5 }
  );
  ctx = { ...ctx, cursorY: ctx.cursorY - 4 };
  ctx = drawParagraph(ctx,
    'E por estarem justas e contratadas, assinam as partes o presente instrumento em duas vias de igual teor e forma, na presenca das testemunhas abaixo identificadas.',
    { size: 10, leading: 1.5 }
  );
  ctx = drawDivider(ctx);

  // ========== ASSINATURAS ==========
  ctx = ensureSpace(ctx, 180);
  ctx = { ...ctx, cursorY: ctx.cursorY - 14 };
  ctx.page.drawText(`${input.forum_city}, ${formatDateLong(new Date().toISOString().slice(0, 10))}.`, {
    x: MARGIN,
    y: ctx.cursorY - 10,
    size: 10,
    font: ctx.font,
    color: COLOR_TEXT,
  });
  ctx = { ...ctx, cursorY: ctx.cursorY - 40 };

  // Linhas de assinatura das partes
  const sigWidth = (PAGE_W - 2 * MARGIN - 30) / 2;
  // CONTRATANTE
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.cursorY },
    end: { x: MARGIN + sigWidth, y: ctx.cursorY },
    thickness: 0.6,
    color: COLOR_TEXT,
  });
  ctx.page.drawText(input.contractor.name, {
    x: MARGIN,
    y: ctx.cursorY - 12,
    size: 9,
    font: ctx.fontBold,
    color: COLOR_TEXT,
  });
  ctx.page.drawText('CONTRATANTE', {
    x: MARGIN,
    y: ctx.cursorY - 24,
    size: 8,
    font: ctx.font,
    color: COLOR_MUTED,
  });
  // CONTRATADO
  const rightX = MARGIN + sigWidth + 30;
  ctx.page.drawLine({
    start: { x: rightX, y: ctx.cursorY },
    end: { x: rightX + sigWidth, y: ctx.cursorY },
    thickness: 0.6,
    color: COLOR_TEXT,
  });
  ctx.page.drawText(input.artist.name, {
    x: rightX,
    y: ctx.cursorY - 12,
    size: 9,
    font: ctx.fontBold,
    color: COLOR_TEXT,
  });
  ctx.page.drawText('CONTRATADO', {
    x: rightX,
    y: ctx.cursorY - 24,
    size: 8,
    font: ctx.font,
    color: COLOR_MUTED,
  });
  ctx = { ...ctx, cursorY: ctx.cursorY - 55 };

  // Testemunhas
  ctx.page.drawText('TESTEMUNHAS:', {
    x: MARGIN,
    y: ctx.cursorY - 10,
    size: 9,
    font: ctx.fontBold,
    color: COLOR_MUTED,
  });
  ctx = { ...ctx, cursorY: ctx.cursorY - 28 };

  // 2 linhas de testemunha
  for (let i = 0; i < 2; i++) {
    const xPos = i === 0 ? MARGIN : rightX;
    ctx.page.drawLine({
      start: { x: xPos, y: ctx.cursorY },
      end: { x: xPos + sigWidth, y: ctx.cursorY },
      thickness: 0.6,
      color: COLOR_TEXT,
    });
    ctx.page.drawText(`Testemunha ${i + 1}`, {
      x: xPos,
      y: ctx.cursorY - 10,
      size: 8,
      font: ctx.font,
      color: COLOR_MUTED,
    });
    ctx.page.drawText('Nome:                                 CPF:', {
      x: xPos,
      y: ctx.cursorY - 20,
      size: 7,
      font: ctx.font,
      color: COLOR_MUTED,
    });
  }

  // Footer em todas as paginas
  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    p.drawText(`Contrato ${input.artist.name} x ${input.contractor.name} — Pagina ${i + 1} de ${pages.length}`, {
      x: MARGIN,
      y: 20,
      size: 7,
      font,
      color: COLOR_MUTED,
    });
    p.drawText('Gerado por Verelus', {
      x: PAGE_W - MARGIN - 80,
      y: 20,
      size: 7,
      font,
      color: COLOR_MUTED,
    });
  });

  return pdf.save();
}
