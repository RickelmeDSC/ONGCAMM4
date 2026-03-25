import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';

@Injectable()
export class EventosService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.evento.findMany({ include: { responsavel: true } });
  }

  async findOne(id: number) {
    const e = await this.prisma.evento.findUnique({ where: { id_evento: id }, include: { responsavel: true } });
    if (!e) throw new NotFoundException(`Evento ${id} não encontrado`);
    return e;
  }

  create(dto: CreateEventoDto) {
    return this.prisma.evento.create({
      data: { ...dto, data_realizacao: new Date(dto.data_realizacao) },
      include: { responsavel: true },
    });
  }

  async update(id: number, dto: UpdateEventoDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.data_realizacao) data.data_realizacao = new Date(dto.data_realizacao);
    return this.prisma.evento.update({ where: { id_evento: id }, data, include: { responsavel: true } });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.evento.delete({ where: { id_evento: id } });
    return { message: `Evento ${id} removido com sucesso` };
  }
}
