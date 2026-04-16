import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCriancaDto } from './dto/create-crianca.dto';
import { UpdateCriancaDto } from './dto/update-crianca.dto';

@Injectable()
export class CriancasService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.crianca.findMany({
      include: { responsavel: true },
    });
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

  private async gerarMatricula(): Promise<number> {
    for (let i = 0; i < 50; i++) {
      const matricula = Math.floor(1000 + Math.random() * 9000); // 1000-9999
      const exists = await this.prisma.crianca.findUnique({ where: { id_matricula: matricula } });
      if (!exists) return matricula;
    }
    throw new ConflictException('Não foi possível gerar matrícula única. Tente novamente.');
  }

  async create(dto: CreateCriancaDto) {
    const id_matricula = await this.gerarMatricula();
    try {
      return await this.prisma.crianca.create({
        data: {
          id_matricula,
          ...dto,
          data_nascimento: new Date(dto.data_nascimento),
        },
        include: { responsavel: true },
      });
    } catch (error: any) {
      if (error.code === 'P2002') throw new ConflictException('CPF já cadastrado');
      if (error.code === 'P2003') throw new NotFoundException('Responsável não encontrado');
      throw error;
    }
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
