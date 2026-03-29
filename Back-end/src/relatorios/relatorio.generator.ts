import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

function header(page: any, font: any, titulo: string) {
  page.drawText('ONG CAMM4', { x: 50, y: 800, size: 18, font, color: rgb(0, 0, 0.6) });
  page.drawText(titulo, { x: 50, y: 775, size: 14, font });
  page.drawText(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { x: 50, y: 755, size: 10, font });
  page.drawLine({ start: { x: 50, y: 748 }, end: { x: 545, y: 748 }, thickness: 1, color: rgb(0, 0, 0) });
}

export async function gerarRelatorioFrequencia(dados: any[]): Promise<Uint8Array> {
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
    page.drawText(String(f.crianca?.nome ?? '-'), { x: 50, y, size: 10, font });
    page.drawText(f.data_registro ? new Date(f.data_registro).toLocaleDateString('pt-BR') : '-', { x: 250, y, size: 10, font });
    page.drawText(String(f.status ?? '-'), { x: 400, y, size: 10, font });
    y -= 18;
  }

  return pdfDoc.save();
}

export async function gerarRelatorioDoacoes(dados: any[]): Promise<Uint8Array> {
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

  return pdfDoc.save();
}

export async function gerarRelatorioAtividades(dados: any[]): Promise<Uint8Array> {
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

  return pdfDoc.save();
}

export async function gerarRelatorioAuditoria(dados: any[]): Promise<Uint8Array> {
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

  return pdfDoc.save();
}

export async function gerarRelatorioCriancas(dados: any[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  header(page, bold, `Relatório de Crianças Cadastradas (${dados.length} registros)`);

  let y = 720;
  const colX = { mat: 50, nome: 85, genero: 250, nasc: 320, cpf: 400, resp: 490 };

  // Cabeçalho da tabela
  const drawTableHeader = (p: any, yPos: number) => {
    p.drawText('Mat.', { x: colX.mat, y: yPos, size: 9, font: bold });
    p.drawText('Nome', { x: colX.nome, y: yPos, size: 9, font: bold });
    p.drawText('Gênero', { x: colX.genero, y: yPos, size: 9, font: bold });
    p.drawText('Nascimento', { x: colX.nasc, y: yPos, size: 9, font: bold });
    p.drawText('CPF', { x: colX.cpf, y: yPos, size: 9, font: bold });
    p.drawText('Responsável', { x: colX.resp, y: yPos, size: 9, font: bold });
    p.drawLine({ start: { x: 50, y: yPos - 5 }, end: { x: 545, y: yPos - 5 }, thickness: 0.5, color: rgb(0.6, 0.6, 0.6) });
    return yPos - 20;
  };

  y = drawTableHeader(page, y);

  for (const c of dados) {
    if (y < 60) {
      page = pdfDoc.addPage([595, 842]);
      header(page, bold, 'Relatório de Crianças Cadastradas (cont.)');
      y = 720;
      y = drawTableHeader(page, y);
    }
    const nasc = new Date(c.data_nascimento).toLocaleDateString('pt-BR');
    page.drawText(String(c.id_matricula), { x: colX.mat, y, size: 9, font });
    page.drawText((c.nome || '-').substring(0, 22), { x: colX.nome, y, size: 9, font });
    page.drawText(c.genero || '-', { x: colX.genero, y, size: 9, font });
    page.drawText(nasc, { x: colX.nasc, y, size: 9, font });
    page.drawText((c.cpf || '-').substring(0, 14), { x: colX.cpf, y, size: 9, font });
    page.drawText((c.responsavel?.nome || '-').substring(0, 15), { x: colX.resp, y, size: 9, font });
    y -= 16;
  }

  // Rodapé com total
  y -= 10;
  if (y < 60) { page = pdfDoc.addPage([595, 842]); y = 780; }
  page.drawLine({ start: { x: 50, y: y + 5 }, end: { x: 545, y: y + 5 }, thickness: 0.5, color: rgb(0.6, 0.6, 0.6) });
  page.drawText(`Total de crianças cadastradas: ${dados.length}`, { x: 50, y: y - 10, size: 11, font: bold });

  return pdfDoc.save();
}

