import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResponsavelDto } from './dto/create-responsavel.dto';
import { UpdateResponsavelDto } from './dto/update-responsavel.dto';

@Injectable()
export class ResponsaveisService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.responsavel.findMany({ include: { criancas: true } });
  }

  async findOne(id: number) {
    const r = await this.prisma.responsavel.findUnique({
      where: { id_responsavel: id },
      include: { criancas: true },
    });
    if (!r) throw new NotFoundException(`Responsável ${id} não encontrado`);
    return r;
  }

  async create(dto: CreateResponsavelDto) {
    const exists = await this.prisma.responsavel.findUnique({ where: { cpf: dto.cpf } });
    if (exists) throw new ConflictException('CPF já cadastrado');
    return this.prisma.responsavel.create({ data: dto });
  }

  async update(id: number, dto: UpdateResponsavelDto) {
    await this.findOne(id);
    if (dto.cpf) {
      const exists = await this.prisma.responsavel.findFirst({
        where: { cpf: dto.cpf, NOT: { id_responsavel: id } },
      });
      if (exists) throw new ConflictException('CPF já cadastrado');
    }
    return this.prisma.responsavel.update({ where: { id_responsavel: id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.responsavel.delete({ where: { id_responsavel: id } });
    return { message: `Responsável ${id} removido com sucesso` };
  }
}
