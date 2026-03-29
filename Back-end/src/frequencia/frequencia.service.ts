import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFrequenciaDto } from './dto/create-frequencia.dto';

@Injectable()
export class FrequenciaService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.frequencia.findMany({ include: { crianca: true } });
  }

  async findByCrianca(id_matricula: number) {
    return this.prisma.frequencia.findMany({
      where: { id_matricula },
      include: { crianca: true },
      orderBy: { data_registro: 'desc' },
    });
  }

  async findByData(data: string) {
    const inicio = new Date(data);
    const fim = new Date(data);
    fim.setDate(fim.getDate() + 1);
    return this.prisma.frequencia.findMany({
      where: { data_registro: { gte: inicio, lt: fim } },
      include: { crianca: true },
    });
  }

  async create(dto: CreateFrequenciaDto) {
    return this.prisma.frequencia.create({
      data: {
        id_matricula: dto.id_matricula,
        status: dto.status,
        ...(dto.data_registro && { data_registro: new Date(dto.data_registro) }),
        ...(dto.turno && { turno: dto.turno }),
        ...(dto.observacao && { observacao: dto.observacao }),
      },
      include: { crianca: true },
    });
  }

  async update(id: number, status: string) {
    const f = await this.prisma.frequencia.findUnique({ where: { id_frequencia: id } });
    if (!f) throw new NotFoundException(`Frequência ${id} não encontrada`);
    return this.prisma.frequencia.update({ where: { id_frequencia: id }, data: { status } });
  }

  async remove(id: number) {
    const f = await this.prisma.frequencia.findUnique({ where: { id_frequencia: id } });
    if (!f) throw new NotFoundException(`Frequência ${id} não encontrada`);
    await this.prisma.frequencia.delete({ where: { id_frequencia: id } });
    return { message: `Frequência ${id} removida com sucesso` };
  }
}
