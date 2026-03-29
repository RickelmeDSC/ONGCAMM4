import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDoacaoDto } from './dto/create-doacao.dto';

@Injectable()
export class DoacoesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(includeInactive = false) {
    return this.prisma.doacao.findMany({
      where: includeInactive ? {} : { ativo: true },
      orderBy: { data_doacao: 'desc' },
    });
  }

  async findOne(id: number) {
    const d = await this.prisma.doacao.findUnique({ where: { id_doacao: id } });
    if (!d) throw new NotFoundException(`Doação ${id} não encontrada`);
    return d;
  }

  create(dto: CreateDoacaoDto) {
    return this.prisma.doacao.create({
      data: {
        doador: dto.doador,
        tipo: dto.tipo,
        valor: dto.valor,
        ...(dto.data_doacao && { data_doacao: new Date(dto.data_doacao) }),
      },
    });
  }

  async update(id: number, dto: Partial<CreateDoacaoDto>) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.data_doacao) data.data_doacao = new Date(dto.data_doacao);
    return this.prisma.doacao.update({ where: { id_doacao: id }, data });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.doacao.update({
      where: { id_doacao: id },
      data: { ativo: false },
    });
    return { message: `Doação ${id} desativada com sucesso` };
  }
}
