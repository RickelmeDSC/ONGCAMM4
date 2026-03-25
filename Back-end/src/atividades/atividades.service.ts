import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAtividadeDto } from './dto/create-atividade.dto';
import { UpdateAtividadeDto } from './dto/update-atividade.dto';

@Injectable()
export class AtividadesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.atividade.findMany({ include: { responsavel: true } });
  }

  async findOne(id: number) {
    const a = await this.prisma.atividade.findUnique({ where: { id_atividade: id }, include: { responsavel: true } });
    if (!a) throw new NotFoundException(`Atividade ${id} não encontrada`);
    return a;
  }

  create(dto: CreateAtividadeDto) {
    return this.prisma.atividade.create({
      data: { ...dto, data_realizacao: new Date(dto.data_realizacao) },
      include: { responsavel: true },
    });
  }

  async update(id: number, dto: UpdateAtividadeDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.data_realizacao) data.data_realizacao = new Date(dto.data_realizacao);
    return this.prisma.atividade.update({ where: { id_atividade: id }, data, include: { responsavel: true } });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.atividade.delete({ where: { id_atividade: id } });
    return { message: `Atividade ${id} removida com sucesso` };
  }
}
