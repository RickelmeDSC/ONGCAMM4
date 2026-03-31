import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeclaracaoDto } from './dto/create-declaracao.dto';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

const AMARELO = rgb(0.93, 0.78, 0.25);

function dataBR(date?: Date): string {
  const d = date || new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

// Quebrar texto longo em varias linhas
function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? current + ' ' + word : word;
    const width = font.widthOfTextAtSize(test, fontSize);
    if (width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

@Injectable()
export class DeclaracoesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.declaracao.findMany({
      include: {
        crianca: { include: { responsavel: true } },
        autorizador: { select: { id_usuario: true, nome: true, email: true, nivel_acesso: true } },
      },
      orderBy: { data_emissao: 'desc' },
    });
  }

  async findOne(id: number) {
    const d = await this.prisma.declaracao.findUnique({
      where: { id_declaracao: id },
      include: {
        crianca: { include: { responsavel: true } },
        autorizador: { select: { id_usuario: true, nome: true, email: true, nivel_acesso: true } },
      },
    });
    if (!d) throw new NotFoundException(`Declaracao ${id} nao encontrada`);
    return d;
  }

  create(dto: CreateDeclaracaoDto) {
    return this.prisma.declaracao.create({
      data: dto,
      include: {
        crianca: { include: { responsavel: true } },
        autorizador: { select: { id_usuario: true, nome: true, email: true, nivel_acesso: true } },
      },
    });
  }

  async gerarPdf(id: number): Promise<Buffer> {
    const decl = await this.findOne(id);
    const crianca = decl.crianca;
    const responsavel = crianca.responsavel;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // ── Header com logo ──
    try {
      const logoPath = path.join(__dirname, '..', 'relatorios', 'logo-camm.png');
      const logoBytes = fs.readFileSync(logoPath);
      const logoImage = await pdfDoc.embedPng(logoBytes);
      const blocoX = (595 - 384) / 2;
      page.drawImage(logoImage, { x: blocoX, y: 738, width: 90, height: 90 });
      const textoX = blocoX + 104;
      page.drawText('Centro de atendimento a', { x: textoX, y: 803, size: 20, font: bold, color: rgb(0.1, 0.1, 0.1) });
      page.drawText('meninos e meninas', { x: textoX, y: 778, size: 20, font: bold, color: rgb(0.1, 0.1, 0.1) });
    } catch (_) {
      page.drawText('CAMM — Centro de Atendimento a Meninos e Meninas', { x: 50, y: 800, size: 16, font: bold });
    }

    // Titulo
    page.drawText('DECLARACAO DE RESPONSABILIDADE', { x: 120, y: 715, size: 16, font: bold, color: rgb(0.1, 0.1, 0.1) });
    page.drawLine({ start: { x: 50, y: 705 }, end: { x: 545, y: 705 }, thickness: 3, color: AMARELO });

    const dataEmissao = dataBR(new Date(decl.data_emissao));
    const dataNasc = dataBR(new Date(crianca.data_nascimento));
    const maxW = 480;
    let y = 680;

    // Corpo do documento
    const paragrafos = [
      `Eu, ${decl.nome_parente}, ${decl.parentesco} da crianca ${crianca.nome}, nascida em ${dataNasc}, matricula n. ${crianca.id_matricula}, declaro, para os devidos fins, que assumo a responsabilidade pela referida crianca junto ao Centro de Atendimento a Meninos e a Meninas (CAMM).`,
      `Na qualidade de responsavel, comprometo-me a:`,
    ];

    for (const p of paragrafos) {
      const lines = wrapText(p, font, 11, maxW);
      for (const line of lines) {
        page.drawText(line, { x: 55, y, size: 11, font, color: rgb(0.15, 0.15, 0.15) });
        y -= 18;
      }
      y -= 6;
    }

    // Lista de compromissos
    const itens = [
      'Manter os dados cadastrais da crianca atualizados junto a instituicao;',
      'Acompanhar a frequencia e participacao da crianca nas atividades educativas, recreativas e culturais promovidas pelo CAMM;',
      'Autorizar a equipe do CAMM a tomar providencias de emergencia em caso de necessidade medica;',
      'Comunicar formalmente a direcao em caso de desistencia ou transferencia;',
      'Zelar pelo bem-estar e seguranca da crianca no trajeto ate a instituicao.',
    ];

    for (const item of itens) {
      const lines = wrapText('- ' + item, font, 10, maxW - 10);
      for (const line of lines) {
        page.drawText(line, { x: 65, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
        y -= 16;
      }
      y -= 2;
    }

    y -= 10;
    const paragrafo2 = `Declaro ainda que estou ciente de que esta declaracao tem validade a partir da presente data e que qualquer alteracao devera ser comunicada formalmente a direcao do CAMM.`;
    const lines2 = wrapText(paragrafo2, font, 11, maxW);
    for (const line of lines2) {
      page.drawText(line, { x: 55, y, size: 11, font, color: rgb(0.15, 0.15, 0.15) });
      y -= 18;
    }

    // Data e local
    y -= 20;
    page.drawText(`Olinda - PE, ${dataEmissao}`, { x: 55, y, size: 11, font });

    // Assinaturas
    y -= 60;
    // Responsavel
    page.drawLine({ start: { x: 55, y: y + 5 }, end: { x: 270, y: y + 5 }, thickness: 0.8, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(decl.nome_parente, { x: 55, y: y - 10, size: 10, font: bold });
    page.drawText(`${decl.parentesco} — Responsavel`, { x: 55, y: y - 23, size: 9, font, color: rgb(0.4, 0.4, 0.4) });

    // Diretor
    page.drawLine({ start: { x: 320, y: y + 5 }, end: { x: 540, y: y + 5 }, thickness: 0.8, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(decl.autorizador.nome, { x: 320, y: y - 10, size: 10, font: bold });
    page.drawText('Diretor(a) — CAMM', { x: 320, y: y - 23, size: 9, font, color: rgb(0.4, 0.4, 0.4) });

    // Rodape
    page.drawLine({ start: { x: 50, y: 45 }, end: { x: 545, y: 45 }, thickness: 1, color: AMARELO });
    page.drawText('Centro de Atendimento a Meninos e a Meninas — CAMM', { x: 140, y: 30, size: 8, font, color: rgb(0.5, 0.5, 0.5) });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}
