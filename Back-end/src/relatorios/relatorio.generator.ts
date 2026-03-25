import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { writeFileSync, mkdirSync } from 'fs';

function header(page: any, font: any, titulo: string) {
  page.drawText('ONG CAMM4', { x: 50, y: 800, size: 18, font, color: rgb(0, 0, 0.6) });
  page.drawText(titulo, { x: 50, y: 775, size: 14, font });
  page.drawText(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { x: 50, y: 755, size: 10, font });
  page.drawLine({ start: { x: 50, y: 748 }, end: { x: 545, y: 748 }, thickness: 1, color: rgb(0, 0, 0) });
}

export async function gerarRelatorioFrequencia(dados: any[]): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  header(page, bold, 'Relatório de Frequência');

  let y = 720;
  page.drawText('Criança', { x: 50, y, size: 11, font: bold });
  page.drawText('Data', { x: 250, y, size: 11, font: bold });
  page.drawText('Status', { x: 400, y, size: 11, font: bold });
  y -= 20;

  for (const f of dados) {
    if (y < 50) break;
    page.drawText(f.crianca?.nome ?? '-', { x: 50, y, size: 10, font });
    page.drawText(new Date(f.data_registro).toLocaleDateString('pt-BR'), { x: 250, y, size: 10, font });
    page.drawText(f.status, { x: 400, y, size: 10, font });
    y -= 18;
  }

  return salvarPdf(pdfDoc, 'frequencia');
}

export async function gerarRelatorioDoacoes(dados: any[]): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  header(page, bold, 'Relatório de Doações');

  let y = 720;
  page.drawText('Doador', { x: 50, y, size: 11, font: bold });
  page.drawText('Tipo', { x: 220, y, size: 11, font: bold });
  page.drawText('Valor', { x: 350, y, size: 11, font: bold });
  page.drawText('Data', { x: 450, y, size: 11, font: bold });
  y -= 20;

  let total = 0;
  for (const d of dados) {
    if (y < 50) break;
    page.drawText(d.doador, { x: 50, y, size: 10, font });
    page.drawText(d.tipo, { x: 220, y, size: 10, font });
    page.drawText(`R$ ${Number(d.valor).toFixed(2)}`, { x: 350, y, size: 10, font });
    page.drawText(new Date(d.data_doacao).toLocaleDateString('pt-BR'), { x: 450, y, size: 10, font });
    total += Number(d.valor);
    y -= 18;
  }

  page.drawText(`Total: R$ ${total.toFixed(2)}`, { x: 350, y: y - 10, size: 12, font: bold });

  return salvarPdf(pdfDoc, 'doacoes');
}

export async function gerarRelatorioAtividades(dados: any[]): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  header(page, bold, 'Relatório de Atividades');

  let y = 720;
  page.drawText('Título', { x: 50, y, size: 11, font: bold });
  page.drawText('Data', { x: 350, y, size: 11, font: bold });
  page.drawText('Responsável', { x: 450, y, size: 11, font: bold });
  y -= 20;

  for (const a of dados) {
    if (y < 50) break;
    page.drawText(a.titulo, { x: 50, y, size: 10, font });
    page.drawText(new Date(a.data_realizacao).toLocaleDateString('pt-BR'), { x: 350, y, size: 10, font });
    page.drawText(a.responsavel?.nome ?? '-', { x: 450, y, size: 10, font });
    y -= 18;
  }

  return salvarPdf(pdfDoc, 'atividades');
}

export async function gerarRelatorioAuditoria(dados: any[]): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  header(page, bold, 'Relatório de Auditoria');

  let y = 720;
  page.drawText('Usuário', { x: 50, y, size: 11, font: bold });
  page.drawText('Ação', { x: 200, y, size: 11, font: bold });
  page.drawText('Data/Hora', { x: 420, y, size: 11, font: bold });
  y -= 20;

  for (const l of dados) {
    if (y < 50) break;
    page.drawText(l.usuario?.nome ?? String(l.id_usuario), { x: 50, y, size: 9, font });
    page.drawText(l.acao.substring(0, 35), { x: 200, y, size: 9, font });
    page.drawText(new Date(l.data_hora).toLocaleString('pt-BR'), { x: 420, y, size: 9, font });
    y -= 16;
  }

  return salvarPdf(pdfDoc, 'auditoria');
}

async function salvarPdf(pdfDoc: PDFDocument, tipo: string): Promise<string> {
  const dir = './uploads/relatorios';
  mkdirSync(dir, { recursive: true });
  const filename = `${tipo}-${Date.now()}.pdf`;
  const path = `${dir}/${filename}`;
  const bytes = await pdfDoc.save();
  writeFileSync(path, bytes);
  return path;
}
