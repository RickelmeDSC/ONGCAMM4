import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeclaracaoDto } from './dto/create-declaracao.dto';
import { writeFileSync, mkdirSync } from 'fs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

@Injectable()
export class DeclaracoesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.declaracao.findMany({
      include: { crianca: true, autorizador: { select: { id_usuario: true, nome: true, email: true, nivel_acesso: true } } },
    });
  }

  async findOne(id: number) {
    const d = await this.prisma.declaracao.findUnique({
      where: { id_declaracao: id },
      include: { crianca: true, autorizador: { select: { id_usuario: true, nome: true, email: true, nivel_acesso: true } } },
    });
    if (!d) throw new NotFoundException(`Declaração ${id} não encontrada`);
    return d;
  }

  create(dto: CreateDeclaracaoDto) {
    return this.prisma.declaracao.create({
      data: dto,
      include: { crianca: true, autorizador: { select: { id_usuario: true, nome: true, email: true, nivel_acesso: true } } },
    });
  }

  async gerarPdf(id: number): Promise<Buffer> {
    const declaracao = await this.findOne(id);

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    page.drawText('ONG CAMM4 — Declaração de Responsabilidade', {
      x: 50, y: 780, size: 16, font: fontBold, color: rgb(0, 0, 0),
    });

    page.drawText(`Data de emissão: ${new Date(declaracao.data_emissao).toLocaleDateString('pt-BR')}`, {
      x: 50, y: 750, size: 11, font,
    });

    page.drawText(`Criança: ${declaracao.crianca.nome}`, { x: 50, y: 710, size: 12, font });
    page.drawText(`Autorizado a buscar: ${declaracao.nome_parente} (${declaracao.parentesco})`, { x: 50, y: 685, size: 12, font });
    page.drawText(`Autorizado por: ${declaracao.autorizador.nome}`, { x: 50, y: 660, size: 12, font });

    page.drawText('_______________________________', { x: 150, y: 200, size: 12, font });
    page.drawText(`${declaracao.autorizador.nome}`, { x: 175, y: 185, size: 11, font });
    page.drawText('Diretor(a) — ONG CAMM4', { x: 175, y: 170, size: 10, font });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}
