import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCriancaDto } from './dto/create-crianca.dto';
import { UpdateCriancaDto } from './dto/update-crianca.dto';

@Injectable()
export class CriancasService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.crianca.findMany({ include: { responsavel: true } });
  }

  async findOne(id: number) {
    const c = await this.prisma.crianca.findUnique({
      where: { id_matricula: id },
      include: { responsavel: true },
    });
    if (!c) throw new NotFoundException(`Criança ${id} não encontrada`);
    return c;
  }

  async search(nome?: string, matricula?: number) {
    return this.prisma.crianca.findMany({
      where: {
        ...(nome && { nome: { contains: nome, mode: 'insensitive' } }),
        ...(matricula && { id_matricula: matricula }),
      },
      include: { responsavel: true },
    });
  }

  async create(dto: CreateCriancaDto) {
    const exists = await this.prisma.crianca.findUnique({ where: { cpf: dto.cpf } });
    if (exists) throw new ConflictException('CPF já cadastrado');
    return this.prisma.crianca.create({
      data: {
        ...dto,
        data_nascimento: new Date(dto.data_nascimento),
      },
      include: { responsavel: true },
    });
  }

  async update(id: number, dto: UpdateCriancaDto) {
    await this.findOne(id);
    if (dto.cpf) {
      const exists = await this.prisma.crianca.findFirst({
        where: { cpf: dto.cpf, NOT: { id_matricula: id } },
      });
      if (exists) throw new ConflictException('CPF já cadastrado');
    }
    const data: any = { ...dto };
    if (dto.data_nascimento) data.data_nascimento = new Date(dto.data_nascimento);
    return this.prisma.crianca.update({
      where: { id_matricula: id },
      data,
      include: { responsavel: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.crianca.delete({ where: { id_matricula: id } });
    return { message: `Criança ${id} removida com sucesso` };
  }
}
