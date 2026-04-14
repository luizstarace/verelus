import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';
import type { PitchInput, PitchOutput } from '@/lib/types/tools';
import { PITCH_RECIPIENT_META } from '@/lib/types/tools';

const COLOR_ACCENT = rgb(0.0, 0.96, 0.63);
const COLOR_TEXT = rgb(0.13, 0.13, 0.13);
const COLOR_MUTED = rgb(0.45, 0.45, 0.45);
const COLOR_LIGHT_BORDER = rgb(0.85, 0.85, 0.85);
const COLOR_HEADLINE_BG = rgb(0.05, 0.05, 0.05);
const COLOR_HEADLINE_FG = rgb(0.98, 0.98, 0.98);

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 50;

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  if (!text) return [''];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const cand = current ? current + ' ' + word : word;
    if (font.widthOfTextAtSize(cand, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = cand;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function generateOnePagerPDF(input: PitchInput, output: PitchOutput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  pdf.setTitle(`1-Pager - ${input.artist_name}`);
  pdf.setAuthor(input.artist_name);
  pdf.setCreator('Verelus');

  const page: PDFPage = pdf.addPage([PAGE_W, PAGE_H]);

  // ==== Headline bar no topo ====
  page.drawRectangle({
    x: 0,
    y: PAGE_H - 150,
    width: PAGE_W,
    height: 150,
    color: COLOR_HEADLINE_BG,
  });
  // Accent bar vertical
  page.drawRectangle({
    x: MARGIN,
    y: PAGE_H - 150 + 40,
    width: 3,
    height: 70,
    color: COLOR_ACCENT,
  });

  // Tag "1-PAGER"
  page.drawText('1-PAGER', {
    x: MARGIN + 15,
    y: PAGE_H - 75,
    size: 9,
    font: fontBold,
    color: COLOR_ACCENT,
  });

  // Nome do artista grande
  const artistName = input.artist_name;
  page.drawText(artistName.toUpperCase(), {
    x: MARGIN + 15,
    y: PAGE_H - 100,
    size: 28,
    font: fontBold,
    color: COLOR_HEADLINE_FG,
  });

  // Hook line
  const hookLines = wrap(output.one_pager.hook_line, font, 11, PAGE_W - (MARGIN * 2) - 15);
  let hookY = PAGE_H - 125;
  for (const line of hookLines.slice(0, 2)) {
    page.drawText(line, {
      x: MARGIN + 15,
      y: hookY,
      size: 11,
      font,
      color: rgb(0.7, 0.7, 0.7),
    });
    hookY -= 14;
  }

  // ==== Bio ====
  let y = PAGE_H - 180;
  page.drawRectangle({ x: MARGIN, y: y - 4, width: 4, height: 14, color: COLOR_ACCENT });
  page.drawText('SOBRE O ARTISTA', {
    x: MARGIN + 10,
    y: y - 1,
    size: 10,
    font: fontBold,
    color: COLOR_TEXT,
  });
  y -= 22;
  const bioLines = wrap(output.one_pager.short_bio, font, 10, PAGE_W - MARGIN * 2);
  for (const line of bioLines) {
    page.drawText(line, { x: MARGIN, y: y, size: 10, font, color: COLOR_TEXT });
    y -= 14;
  }

  // ==== Highlights ====
  y -= 12;
  page.drawRectangle({ x: MARGIN, y: y - 4, width: 4, height: 14, color: COLOR_ACCENT });
  page.drawText('DESTAQUES', {
    x: MARGIN + 10,
    y: y - 1,
    size: 10,
    font: fontBold,
    color: COLOR_TEXT,
  });
  y -= 22;
  for (const hl of output.one_pager.highlights) {
    const hlLines = wrap(hl, font, 10, PAGE_W - MARGIN * 2 - 20);
    for (let i = 0; i < hlLines.length; i++) {
      if (i === 0) {
        page.drawCircle({ x: MARGIN + 6, y: y + 3, size: 1.5, color: COLOR_ACCENT });
        page.drawText(hlLines[i], { x: MARGIN + 16, y: y, size: 10, font, color: COLOR_TEXT });
      } else {
        page.drawText(hlLines[i], { x: MARGIN + 16, y: y, size: 10, font, color: COLOR_TEXT });
      }
      y -= 14;
    }
    y -= 3;
  }

  // ==== Release info ====
  y -= 12;
  page.drawRectangle({ x: MARGIN, y: y - 4, width: 4, height: 14, color: COLOR_ACCENT });
  page.drawText('RELEASE EM FOCO', {
    x: MARGIN + 10,
    y: y - 1,
    size: 10,
    font: fontBold,
    color: COLOR_TEXT,
  });
  y -= 22;

  const releaseLines: Array<[string, string]> = [
    ['Titulo', input.song_title],
    ['Tipo', input.release_type.toUpperCase()],
    ['Genero', input.genre_primary],
    ['Mood', input.mood_keywords],
  ];
  if (input.release_date) releaseLines.push(['Lancamento', input.release_date]);
  if (input.song_spotify_url) releaseLines.push(['Spotify', input.song_spotify_url]);

  for (const [label, value] of releaseLines) {
    page.drawText(label.toUpperCase(), {
      x: MARGIN,
      y: y,
      size: 7,
      font: fontBold,
      color: COLOR_MUTED,
    });
    const valueLines = wrap(value, font, 10, PAGE_W - MARGIN - 160);
    for (let i = 0; i < valueLines.length; i++) {
      page.drawText(valueLines[i], {
        x: MARGIN + 110,
        y: y - (i * 12),
        size: 10,
        font,
        color: COLOR_TEXT,
      });
    }
    y -= Math.max(14, valueLines.length * 12 + 2);
  }

  // ==== Similar artists ====
  y -= 12;
  page.drawRectangle({ x: MARGIN, y: y - 4, width: 4, height: 14, color: COLOR_ACCENT });
  page.drawText('PARA FAS DE', {
    x: MARGIN + 10,
    y: y - 1,
    size: 10,
    font: fontBold,
    color: COLOR_TEXT,
  });
  y -= 22;
  const similarLines = wrap(input.similar_artists, font, 10, PAGE_W - MARGIN * 2);
  for (const line of similarLines) {
    page.drawText(line, { x: MARGIN, y: y, size: 10, font, color: COLOR_TEXT });
    y -= 14;
  }

  // ==== Footer: enviado para ====
  const footerY = 60;
  page.drawLine({
    start: { x: MARGIN, y: footerY + 20 },
    end: { x: PAGE_W - MARGIN, y: footerY + 20 },
    thickness: 0.4,
    color: COLOR_LIGHT_BORDER,
  });
  page.drawText('PITCH ENVIADO PARA', {
    x: MARGIN,
    y: footerY + 6,
    size: 7,
    font: fontBold,
    color: COLOR_MUTED,
  });
  page.drawText(
    `${input.recipient_name} — ${PITCH_RECIPIENT_META[input.recipient_type].label}`,
    {
      x: MARGIN,
      y: footerY - 6,
      size: 10,
      font,
      color: COLOR_TEXT,
    }
  );

  // Gerado por Verelus
  page.drawText('Gerado por Verelus', {
    x: PAGE_W - MARGIN - 80,
    y: 18,
    size: 7,
    font,
    color: COLOR_MUTED,
  });

  return pdf.save();
}
