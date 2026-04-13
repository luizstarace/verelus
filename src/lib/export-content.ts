export function exportAsText(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  downloadBlob(blob, `${filename}.txt`);
}

export function exportAsPDF(content: string, title: string) {
  // Generate a simple PDF using a printable HTML window
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>${escapeHtml(title)}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          max-width: 700px;
          margin: 40px auto;
          padding: 20px;
          color: #1a1a1a;
          line-height: 1.6;
        }
        h1 {
          font-size: 20px;
          border-bottom: 2px solid #00f5a0;
          padding-bottom: 8px;
          margin-bottom: 20px;
        }
        pre {
          white-space: pre-wrap;
          word-wrap: break-word;
          font-family: inherit;
          font-size: 14px;
        }
        .footer {
          margin-top: 40px;
          font-size: 11px;
          color: #999;
          border-top: 1px solid #eee;
          padding-top: 10px;
        }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(title)}</h1>
      <pre>${escapeHtml(content)}</pre>
      <div class="footer">Gerado por Verelus &mdash; ${new Date().toLocaleDateString("pt-BR")}</div>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
