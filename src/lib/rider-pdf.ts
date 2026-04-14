import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';
import type { RiderInput, MusicianSpec } from '@/lib/types/tools';
import { STAGE_TEMPLATES } from '@/lib/types/tools';

// Paleta do Verelus (brand colors em rgb 0-1)
const COLOR_ACCENT = rgb(0.0, 0.96, 0.63);    // verde brand
const COLOR_TEXT = rgb(0.13, 0.13, 0.13);
const COLOR_MUTED = rgb(0.45, 0.45, 0.45);
const COLOR_LIGHT_BORDER = rgb(0.85, 0.85, 0.85);
const COLOR_SUBTLE_BG = rgb(0.97, 0.97, 0.97);

const PAGE_W = 595;    // A4 em points
const PAGE_H = 842;
const MARGIN = 50;

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
  if (ctx.cursorY - needed < MARGIN) return newPage(ctx);
  return ctx;
}

function drawText(ctx: DrawContext, text: string, opts: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; x?: number; indent?: number }): DrawContext {
  const size = opts.size ?? 10;
  const color = opts.color ?? COLOR_TEXT;
  const font = opts.bold ? ctx.fontBold : ctx.font;
  const x = opts.x ?? MARGIN + (opts.indent ?? 0);
  // Wrap simples por largura
  const maxWidth = PAGE_W - MARGIN - x;
  const lines = wrapText(text, font, size, maxWidth);
  let c = ctx;
  for (const line of lines) {
    c = ensureSpace(c, size + 4);
    c.page.drawText(line, { x, y: c.cursorY - size, size, font, color });
    c = { ...c, cursorY: c.cursorY - (size * 1.35) };
  }
  return c;
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  if (!text) return [''];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? current + ' ' + word : word;
    const w = font.widthOfTextAtSize(candidate, size);
    if (w > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawDivider(ctx: DrawContext): DrawContext {
  const c = ensureSpace(ctx, 12);
  c.page.drawLine({
    start: { x: MARGIN, y: c.cursorY - 6 },
    end: { x: PAGE_W - MARGIN, y: c.cursorY - 6 },
    thickness: 0.5,
    color: COLOR_LIGHT_BORDER,
  });
  return { ...c, cursorY: c.cursorY - 18 };
}

function drawSectionHeader(ctx: DrawContext, title: string): DrawContext {
  let c = ensureSpace(ctx, 28);
  c = { ...c, cursorY: c.cursorY - 8 };
  // Barra accent
  c.page.drawRectangle({
    x: MARGIN,
    y: c.cursorY - 14,
    width: 4,
    height: 14,
    color: COLOR_ACCENT,
  });
  c.page.drawText(title.toUpperCase(), {
    x: MARGIN + 12,
    y: c.cursorY - 11,
    size: 11,
    font: c.fontBold,
    color: COLOR_TEXT,
  });
  return { ...c, cursorY: c.cursorY - 24 };
}

function drawKeyValue(ctx: DrawContext, label: string, value: string): DrawContext {
  let c = ensureSpace(ctx, 14);
  const labelWidth = 140;
  c.page.drawText(label.toUpperCase(), {
    x: MARGIN,
    y: c.cursorY - 10,
    size: 8,
    font: c.fontBold,
    color: COLOR_MUTED,
  });
  // Wrap valor se muito longo
  const wrapped = wrapText(value, c.font, 10, PAGE_W - MARGIN - (MARGIN + labelWidth));
  for (let i = 0; i < wrapped.length; i++) {
    if (i > 0) c = ensureSpace(c, 14);
    c.page.drawText(wrapped[i], {
      x: MARGIN + labelWidth,
      y: c.cursorY - 10,
      size: 10,
      font: c.font,
      color: COLOR_TEXT,
    });
    c = { ...c, cursorY: c.cursorY - 14 };
  }
  return c;
}

function drawStageDiagram(ctx: DrawContext, template: RiderInput['stage_template'], musicians: MusicianSpec[]): DrawContext {
  let c = ensureSpace(ctx, 200);
  c = { ...c, cursorY: c.cursorY - 8 };

  const diagramWidth = PAGE_W - 2 * MARGIN;
  const diagramHeight = 160;
  const diagramX = MARGIN;
  const diagramY = c.cursorY - diagramHeight;

  // Fundo do diagrama
  c.page.drawRectangle({
    x: diagramX,
    y: diagramY,
    width: diagramWidth,
    height: diagramHeight,
    color: COLOR_SUBTLE_BG,
    borderColor: COLOR_LIGHT_BORDER,
    borderWidth: 0.5,
  });

  // "PUBLICO" label
  c.page.drawText('PUBLICO', {
    x: diagramX + diagramWidth / 2 - 20,
    y: diagramY + 8,
    size: 9,
    font: c.fontBold,
    color: COLOR_MUTED,
  });

  // Posicionamento dos musicos — layout por template
  const positions = computeStagePositions(template, musicians.length, diagramX, diagramY, diagramWidth, diagramHeight);

  positions.forEach((pos, i) => {
    const m = musicians[i];
    if (!m) return;
    // Circle representing musician
    c.page.drawCircle({
      x: pos.x,
      y: pos.y,
      size: 14,
      color: COLOR_ACCENT,
    });
    // Numero dentro
    c.page.drawText(String(i + 1), {
      x: pos.x - 3,
      y: pos.y - 4,
      size: 10,
      font: c.fontBold,
      color: rgb(0, 0, 0),
    });
    // Label do instrumento abaixo do circulo
    const label = m.role || `Musico ${i + 1}`;
    const labelWidth = c.font.widthOfTextAtSize(label, 8);
    c.page.drawText(label, {
      x: pos.x - labelWidth / 2,
      y: pos.y - 26,
      size: 8,
      font: c.font,
      color: COLOR_TEXT,
    });
  });

  return { ...c, cursorY: diagramY - 12 };
}

interface Position {
  x: number;
  y: number;
}

function computeStagePositions(
  template: RiderInput['stage_template'],
  count: number,
  areaX: number,
  areaY: number,
  areaW: number,
  areaH: number
): Position[] {
  const centerX = areaX + areaW / 2;
  const frontY = areaY + areaH * 0.35;
  const midY = areaY + areaH * 0.55;
  const backY = areaY + areaH * 0.75;

  switch (template) {
    case 'solo_acoustic':
    case 'solo_electric':
    case 'dj_setup':
      return [{ x: centerX, y: frontY }];
    case 'duo':
      return [
        { x: centerX - 80, y: frontY },
        { x: centerX + 80, y: frontY },
      ];
    case 'power_trio':
      return [
        { x: centerX - 100, y: frontY },  // guitarra
        { x: centerX + 100, y: frontY },  // baixo
        { x: centerX, y: backY },          // bateria
      ];
    case 'quartet':
      return [
        { x: centerX - 120, y: frontY },
        { x: centerX - 40, y: frontY },
        { x: centerX + 60, y: frontY },
        { x: centerX, y: backY },
      ];
    case 'five_piece':
      return [
        { x: centerX - 150, y: frontY },
        { x: centerX - 60, y: frontY },
        { x: centerX + 30, y: frontY },
        { x: centerX + 120, y: frontY },
        { x: centerX, y: backY },
      ];
    case 'six_plus':
    case 'custom':
    default: {
      // Distribui em linha frontal + linha traseira conforme count
      const frontCount = Math.ceil(count / 2);
      const backCount = count - frontCount;
      const positions: Position[] = [];
      for (let i = 0; i < frontCount; i++) {
        const x = areaX + (areaW * (i + 1)) / (frontCount + 1);
        positions.push({ x, y: frontY });
      }
      for (let i = 0; i < backCount; i++) {
        const x = areaX + (areaW * (i + 1)) / (backCount + 1);
        positions.push({ x, y: backY });
      }
      return positions;
    }
  }
}

export async function generateRiderPDF(input: RiderInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // Metadata
  pdf.setTitle(`Rider Tecnico - ${input.artist_name}`);
  pdf.setAuthor(input.artist_name);
  pdf.setSubject('Rider Tecnico');
  pdf.setCreator('Verelus');

  const firstPage = pdf.addPage([PAGE_W, PAGE_H]);
  let ctx: DrawContext = { pdf, page: firstPage, font, fontBold, cursorY: PAGE_H - MARGIN };

  // ----------- CAPA -----------
  // Titulo "RIDER TECNICO"
  ctx.page.drawText('RIDER TECNICO', {
    x: MARGIN,
    y: ctx.cursorY - 18,
    size: 11,
    font: ctx.fontBold,
    color: COLOR_MUTED,
  });
  ctx = { ...ctx, cursorY: ctx.cursorY - 40 };

  // Nome do artista grande
  ctx.page.drawText(input.artist_name, {
    x: MARGIN,
    y: ctx.cursorY - 36,
    size: 36,
    font: ctx.fontBold,
    color: COLOR_TEXT,
  });
  ctx = { ...ctx, cursorY: ctx.cursorY - 50 };

  // Barra accent
  ctx.page.drawRectangle({
    x: MARGIN,
    y: ctx.cursorY - 4,
    width: 60,
    height: 3,
    color: COLOR_ACCENT,
  });
  ctx = { ...ctx, cursorY: ctx.cursorY - 24 };

  // ----------- CONTATO -----------
  ctx = drawSectionHeader(ctx, 'Contato da producao');
  ctx = drawKeyValue(ctx, 'Responsavel', input.contact_name);
  ctx = drawKeyValue(ctx, 'E-mail', input.contact_email);
  ctx = drawKeyValue(ctx, 'Telefone', input.contact_phone);
  ctx = drawDivider(ctx);

  // ----------- FORMATO DA BANDA -----------
  ctx = drawSectionHeader(ctx, 'Formacao');
  const templateLabel = STAGE_TEMPLATES[input.stage_template].label;
  ctx = drawKeyValue(ctx, 'Formato', templateLabel);
  ctx = drawKeyValue(ctx, 'Numero de musicos', String(input.musicians.length));

  // Lista de musicos
  ctx = ensureSpace(ctx, 16);
  ctx.page.drawText('MUSICOS E INSTRUMENTACAO', {
    x: MARGIN,
    y: ctx.cursorY - 10,
    size: 8,
    font: ctx.fontBold,
    color: COLOR_MUTED,
  });
  ctx = { ...ctx, cursorY: ctx.cursorY - 18 };

  input.musicians.forEach((m, i) => {
    const needs = [
      m.needs_mic ? 'microfone' : null,
      m.needs_monitor ? 'monitor' : null,
      m.needs_di ? 'DI' : null,
    ].filter(Boolean).join(', ');
    const line = `${i + 1}. ${m.role}: ${m.instrument}${needs ? ` (${needs})` : ''}${m.notes ? ` — ${m.notes}` : ''}`;
    ctx = drawText(ctx, line, { size: 10 });
  });
  ctx = drawDivider(ctx);

  // ----------- DIAGRAMA DE PALCO -----------
  ctx = drawSectionHeader(ctx, 'Diagrama de palco');
  ctx = drawStageDiagram(ctx, input.stage_template, input.musicians);
  ctx = drawDivider(ctx);

  // ----------- SOM E ILUMINACAO -----------
  ctx = drawSectionHeader(ctx, 'Som e iluminacao');
  ctx = drawKeyValue(ctx, 'PA minimo', `${input.pa_minimum_watts} watts`);
  const lightingLabel = input.lighting === 'basic' ? 'Basica' : input.lighting === 'scenic' ? 'Cenica' : 'Customizada';
  ctx = drawKeyValue(ctx, 'Iluminacao', lightingLabel);
  if (input.lighting_notes) ctx = drawKeyValue(ctx, 'Detalhes iluminacao', input.lighting_notes);
  ctx = drawKeyValue(ctx, 'Tempo passagem de som', `${input.soundcheck_minutes} minutos minimo`);
  ctx = drawDivider(ctx);

  // ----------- RIDER PESSOAL -----------
  ctx = drawSectionHeader(ctx, 'Rider pessoal');
  ctx = drawKeyValue(ctx, 'Camarim', input.dressing_room ? 'Necessario' : 'Dispensavel');
  ctx = drawKeyValue(ctx, 'Refeicoes', input.meals_needed ? `Sim — ${input.meals_count} refeicoes` : 'Nao necessarias');
  ctx = drawKeyValue(ctx, 'Hospedagem', input.accommodation ? 'Necessaria' : 'Dispensavel');
  if (input.accommodation_details) ctx = drawKeyValue(ctx, 'Detalhes hospedagem', input.accommodation_details);
  if (input.transport_notes) ctx = drawKeyValue(ctx, 'Transporte', input.transport_notes);
  ctx = drawDivider(ctx);

  // ----------- OBSERVACOES ESPECIAIS -----------
  if (input.special_technical_notes) {
    ctx = drawSectionHeader(ctx, 'Observacoes tecnicas especiais');
    ctx = drawText(ctx, input.special_technical_notes, { size: 10 });
    ctx = drawDivider(ctx);
  }

  // ----------- FOOTER -----------
  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    p.drawText(`Rider ${input.artist_name} — Pagina ${i + 1} de ${pages.length}`, {
      x: MARGIN,
      y: 20,
      size: 8,
      font,
      color: COLOR_MUTED,
    });
    p.drawText('Gerado por Verelus', {
      x: PAGE_W - MARGIN - 80,
      y: 20,
      size: 8,
      font,
      color: COLOR_MUTED,
    });
  });

  return pdf.save();
}
