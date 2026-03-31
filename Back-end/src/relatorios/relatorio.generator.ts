import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

// Cor amarela CAMM
const AMARELO = rgb(0.93, 0.78, 0.25); // #EEC83F

// Formatar data brasileira manualmente (evita problemas de locale no servidor)
function dataBR(): string {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${d}/${m}/${y}, ${h}:${min}`;
}

async function header(pdfDoc: any, page: any, font: any, bold: any, titulo: string) {
  // Embed logo
  try {
    const logoPath = path.join(__dirname, 'logo-camm.png');
    const logoBytes = fs.readFileSync(logoPath);
    const logoImage = await pdfDoc.embedPng(logoBytes);
    const logoDims = logoImage.scale(0.5);
    page.drawImage(logoImage, {
      x: 50,
      y: 740,
      width: 90,
      height: 90,
    });
  } catch (_) {
    // Se logo nao existe, usa texto fallback
    page.drawText('CAMM', { x: 50, y: 790, size: 24, font: bold, color: rgb(0.16, 0.5, 0.73) });
  }

  // Titulo ao lado do logo
  page.drawText('Centro de atendimento a', { x: 150, y: 805, size: 20, font: bold, color: rgb(0.1, 0.1, 0.1) });
  page.drawText('meninos e meninas', { x: 150, y: 780, size: 20, font: bold, color: rgb(0.1, 0.1, 0.1) });

  // Subtitulo do relatorio
  page.drawText(titulo, { x: 50, y: 725, size: 13, font: bold, color: rgb(0.1, 0.1, 0.1) });
  page.drawText(`Gerado em: ${dataBR()}`, { x: 50, y: 708, size: 10, font, color: rgb(0.35, 0.35, 0.35) });

  // Linha amarela
  page.drawLine({
    start: { x: 50, y: 698 },
    end: { x: 545, y: 698 },
    thickness: 3,
    color: AMARELO,
  });

  return 680; // Y position apos o header
}

export async function gerarRelatorioFrequencia(dados: any[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = await header(pdfDoc, page, font, bold, 'Relatorio de Frequencia');

  // Cabecalho da tabela
  const drawTableHeader = (p: any, yPos: number) => {
    p.drawRectangle({ x: 48, y: yPos - 5, width: 500, height: 22, color: rgb(0.95, 0.95, 0.95) });
    p.drawText('Crianca', { x: 55, y: yPos, size: 10, font: bold });
    p.drawText('Data', { x: 250, y: yPos, size: 10, font: bold });
    p.drawText('Turno', { x: 350, y: yPos, size: 10, font: bold });
    p.drawText('Status', { x: 440, y: yPos, size: 10, font: bold });
    p.drawLine({ start: { x: 48, y: yPos - 6 }, end: { x: 548, y: yPos - 6 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
    return yPos - 22;
  };

  y = drawTableHeader(page, y);

  let presentes = 0;
  let ausentes = 0;

  for (const f of dados) {
    if (y < 60) {
      page = pdfDoc.addPage([595, 842]);
      y = await header(pdfDoc, page, font, bold, 'Relatorio de Frequencia (cont.)');
      y = drawTableHeader(page, y);
    }
    const nome = String(f.crianca?.nome ?? '-').substring(0, 25);
    const data = f.data_registro ? (() => { const d = new Date(f.data_registro); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; })() : '-';
    const turno = String(f.turno ?? '-');
    const status = String(f.status ?? '-');

    if (status.toLowerCase() === 'presente') presentes++;
    else ausentes++;

    // Cor do status
    const statusColor = status.toLowerCase() === 'presente' ? rgb(0.1, 0.55, 0.1) : rgb(0.75, 0.15, 0.15);

    page.drawText(nome, { x: 55, y, size: 9, font });
    page.drawText(data, { x: 250, y, size: 9, font });
    page.drawText(turno, { x: 350, y, size: 9, font });
    page.drawText(status, { x: 440, y, size: 9, font, color: statusColor });

    y -= 16;
  }

  // Resumo
  y -= 10;
  if (y < 80) { page = pdfDoc.addPage([595, 842]); y = 780; }
  page.drawLine({ start: { x: 48, y: y + 5 }, end: { x: 548, y: y + 5 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
  page.drawText(`Total de registros: ${dados.length}`, { x: 55, y: y - 10, size: 10, font: bold });
  page.drawText(`Presentes: ${presentes}`, { x: 250, y: y - 10, size: 10, font, color: rgb(0.1, 0.55, 0.1) });
  page.drawText(`Ausentes: ${ausentes}`, { x: 380, y: y - 10, size: 10, font, color: rgb(0.75, 0.15, 0.15) });

  return pdfDoc.save();
}

export async function gerarRelatorioDoacoes(dados: any[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = await header(pdfDoc, page, font, bold, 'Relatorio de Doacoes');

  const drawTableHeader = (p: any, yPos: number) => {
    p.drawRectangle({ x: 48, y: yPos - 5, width: 500, height: 22, color: rgb(0.95, 0.95, 0.95) });
    p.drawText('Doador', { x: 55, y: yPos, size: 10, font: bold });
    p.drawText('Tipo', { x: 220, y: yPos, size: 10, font: bold });
    p.drawText('Valor', { x: 340, y: yPos, size: 10, font: bold });
    p.drawText('Data', { x: 450, y: yPos, size: 10, font: bold });
    p.drawLine({ start: { x: 48, y: yPos - 6 }, end: { x: 548, y: yPos - 6 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
    return yPos - 22;
  };

  y = drawTableHeader(page, y);

  let total = 0;
  for (const d of dados) {
    if (y < 60) {
      page = pdfDoc.addPage([595, 842]);
      y = await header(pdfDoc, page, font, bold, 'Relatorio de Doacoes (cont.)');
      y = drawTableHeader(page, y);
    }
    const valor = d.valor != null ? Number(d.valor) : 0;
    total += valor;
    const data = d.data_doacao ? (() => { const dt = new Date(d.data_doacao); return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`; })() : '-';

    page.drawText(String(d.doador || '-').substring(0, 22), { x: 55, y, size: 9, font });
    page.drawText(String(d.tipo || '-'), { x: 220, y, size: 9, font });
    page.drawText(valor > 0 ? `R$ ${valor.toFixed(2)}` : '-', { x: 340, y, size: 9, font });
    page.drawText(data, { x: 450, y, size: 9, font });
    y -= 16;
  }

  y -= 10;
  if (y < 80) { page = pdfDoc.addPage([595, 842]); y = 780; }
  page.drawLine({ start: { x: 48, y: y + 5 }, end: { x: 548, y: y + 5 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
  page.drawText(`Total: ${dados.length} doacoes`, { x: 55, y: y - 10, size: 10, font: bold });
  page.drawText(`Valor total: R$ ${total.toFixed(2)}`, { x: 300, y: y - 10, size: 10, font: bold, color: rgb(0.1, 0.55, 0.1) });

  return pdfDoc.save();
}

export async function gerarRelatorioAtividades(dados: any[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = await header(pdfDoc, page, font, bold, 'Relatorio de Atividades');

  const drawTableHeader = (p: any, yPos: number) => {
    p.drawRectangle({ x: 48, y: yPos - 5, width: 500, height: 22, color: rgb(0.95, 0.95, 0.95) });
    p.drawText('Titulo', { x: 55, y: yPos, size: 10, font: bold });
    p.drawText('Data', { x: 350, y: yPos, size: 10, font: bold });
    p.drawText('Responsavel', { x: 450, y: yPos, size: 10, font: bold });
    p.drawLine({ start: { x: 48, y: yPos - 6 }, end: { x: 548, y: yPos - 6 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
    return yPos - 22;
  };

  y = drawTableHeader(page, y);

  for (const a of dados) {
    if (y < 60) {
      page = pdfDoc.addPage([595, 842]);
      y = await header(pdfDoc, page, font, bold, 'Relatorio de Atividades (cont.)');
      y = drawTableHeader(page, y);
    }
    const data = a.data_realizacao ? (() => { const dt = new Date(a.data_realizacao); return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`; })() : '-';
    page.drawText(String(a.titulo || '-').substring(0, 40), { x: 55, y, size: 9, font });
    page.drawText(data, { x: 350, y, size: 9, font });
    page.drawText(String(a.responsavel?.nome ?? '-').substring(0, 15), { x: 450, y, size: 9, font });
    y -= 16;
  }

  y -= 10;
  if (y < 80) { page = pdfDoc.addPage([595, 842]); y = 780; }
  page.drawLine({ start: { x: 48, y: y + 5 }, end: { x: 548, y: y + 5 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
  page.drawText(`Total de atividades: ${dados.length}`, { x: 55, y: y - 10, size: 10, font: bold });

  return pdfDoc.save();
}

export async function gerarRelatorioAuditoria(dados: any[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = await header(pdfDoc, page, font, bold, 'Relatorio de Auditoria');

  const drawTableHeader = (p: any, yPos: number) => {
    p.drawRectangle({ x: 48, y: yPos - 5, width: 500, height: 22, color: rgb(0.95, 0.95, 0.95) });
    p.drawText('Usuario', { x: 55, y: yPos, size: 10, font: bold });
    p.drawText('Acao', { x: 200, y: yPos, size: 10, font: bold });
    p.drawText('Data/Hora', { x: 420, y: yPos, size: 10, font: bold });
    p.drawLine({ start: { x: 48, y: yPos - 6 }, end: { x: 548, y: yPos - 6 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
    return yPos - 22;
  };

  y = drawTableHeader(page, y);

  for (const l of dados) {
    if (y < 60) {
      page = pdfDoc.addPage([595, 842]);
      y = await header(pdfDoc, page, font, bold, 'Relatorio de Auditoria (cont.)');
      y = drawTableHeader(page, y);
    }
    const dataHora = l.data_hora ? (() => { const dt = new Date(l.data_hora); return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`; })() : '-';
    page.drawText(String(l.usuario?.nome ?? String(l.id_usuario)).substring(0, 20), { x: 55, y, size: 9, font });
    page.drawText(String(l.acao || '-').substring(0, 35), { x: 200, y, size: 9, font });
    page.drawText(dataHora, { x: 420, y, size: 9, font });
    y -= 16;
  }

  y -= 10;
  if (y < 80) { page = pdfDoc.addPage([595, 842]); y = 780; }
  page.drawLine({ start: { x: 48, y: y + 5 }, end: { x: 548, y: y + 5 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
  page.drawText(`Total de registros: ${dados.length}`, { x: 55, y: y - 10, size: 10, font: bold });

  return pdfDoc.save();
}

export async function gerarRelatorioCriancas(dados: any[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = await header(pdfDoc, page, font, bold, `Relatorio de Criancas Cadastradas (${dados.length} registros)`);

  const colX = { mat: 55, nome: 90, genero: 250, nasc: 320, cpf: 400, resp: 490 };

  const drawTableHeader = (p: any, yPos: number) => {
    p.drawRectangle({ x: 48, y: yPos - 5, width: 500, height: 22, color: rgb(0.95, 0.95, 0.95) });
    p.drawText('Mat.', { x: colX.mat, y: yPos, size: 9, font: bold });
    p.drawText('Nome', { x: colX.nome, y: yPos, size: 9, font: bold });
    p.drawText('Genero', { x: colX.genero, y: yPos, size: 9, font: bold });
    p.drawText('Nascimento', { x: colX.nasc, y: yPos, size: 9, font: bold });
    p.drawText('CPF', { x: colX.cpf, y: yPos, size: 9, font: bold });
    p.drawText('Responsavel', { x: colX.resp, y: yPos, size: 9, font: bold });
    p.drawLine({ start: { x: 48, y: yPos - 6 }, end: { x: 548, y: yPos - 6 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
    return yPos - 22;
  };

  y = drawTableHeader(page, y);

  for (const c of dados) {
    if (y < 60) {
      page = pdfDoc.addPage([595, 842]);
      y = await header(pdfDoc, page, font, bold, 'Relatorio de Criancas Cadastradas (cont.)');
      y = drawTableHeader(page, y);
    }
    const nasc = c.data_nascimento ? (() => { const d = new Date(c.data_nascimento); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; })() : '-';
    page.drawText(String(c.id_matricula), { x: colX.mat, y, size: 9, font });
    page.drawText((c.nome || '-').substring(0, 22), { x: colX.nome, y, size: 9, font });
    page.drawText(c.genero || '-', { x: colX.genero, y, size: 9, font });
    page.drawText(nasc, { x: colX.nasc, y, size: 9, font });
    page.drawText((c.cpf || '-').substring(0, 14), { x: colX.cpf, y, size: 9, font });
    page.drawText((c.responsavel?.nome || '-').substring(0, 15), { x: colX.resp, y, size: 9, font });
    y -= 16;
  }

  y -= 10;
  if (y < 60) { page = pdfDoc.addPage([595, 842]); y = 780; }
  page.drawLine({ start: { x: 48, y: y + 5 }, end: { x: 548, y: y + 5 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
  page.drawText(`Total de criancas cadastradas: ${dados.length}`, { x: 55, y: y - 10, size: 11, font: bold });

  return pdfDoc.save();
}
