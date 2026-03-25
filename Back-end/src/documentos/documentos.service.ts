import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentosService {
  constructor(private readonly prisma: PrismaService) {}

  private async getCrianca(id: number) {
    const c = await this.prisma.crianca.findUnique({ where: { id_matricula: id } });
    if (!c) throw new NotFoundException(`Criança ${id} não encontrada`);
    return c;
  }

  async uploadFoto(id: number, filename: string) {
    await this.getCrianca(id);
    return this.prisma.crianca.update({
      where: { id_matricula: id },
      data: { foto_path: `uploads/fotos/${filename}` },
      select: { id_matricula: true, nome: true, foto_path: true },
    });
  }

  async uploadCertidao(id: number, filename: string) {
    await this.getCrianca(id);
    return this.prisma.crianca.update({
      where: { id_matricula: id },
      data: { certidao_nasc: `uploads/certidoes/${filename}` },
      select: { id_matricula: true, nome: true, certidao_nasc: true },
    });
  }

  async uploadVacina(id: number, filename: string) {
    await this.getCrianca(id);
    return this.prisma.crianca.update({
      where: { id_matricula: id },
      data: { cartao_vacina: `uploads/cartoes-vacina/${filename}` },
      select: { id_matricula: true, nome: true, cartao_vacina: true },
    });
  }

  async getDocumentos(id: number) {
    const c = await this.getCrianca(id);
    return {
      id_matricula: c.id_matricula,
      nome: c.nome,
      foto_path: c.foto_path,
      certidao_nasc: c.certidao_nasc,
      cartao_vacina: c.cartao_vacina,
    };
  }
}
