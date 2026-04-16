import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import * as bcrypt from 'bcryptjs';

const SELECT_FIELDS = {
  id_usuario: true,
  nome: true,
  email: true,
  nivel_acesso: true,
};

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.usuario.findMany({
      select: SELECT_FIELDS,
    });
  }

  async findOne(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id_usuario: id },
      select: SELECT_FIELDS,
    });
    if (!usuario) throw new NotFoundException(`Usuário ${id} não encontrado`);
    return usuario;
  }

  async create(dto: CreateUsuarioDto) {
    const senha_hash = await bcrypt.hash(dto.senha, 12);
    try {
      return await this.prisma.usuario.create({
        data: {
          nome: dto.nome,
          email: dto.email,
          senha_hash,
          nivel_acesso: dto.nivel_acesso,
        },
        select: SELECT_FIELDS,
      });
    } catch (error: any) {
      if (error.code === 'P2002') throw new ConflictException('E-mail já cadastrado');
      throw error;
    }
  }

  async update(id: number, dto: UpdateUsuarioDto) {
    await this.findOne(id);

    if (dto.email) {
      const exists = await this.prisma.usuario.findFirst({
        where: { email: dto.email, NOT: { id_usuario: id } },
      });
      if (exists) throw new ConflictException('E-mail já cadastrado');
    }

    const data: any = { ...dto };
    if (dto.senha) {
      data.senha_hash = await bcrypt.hash(dto.senha, 12);
      delete data.senha;
    }

    return this.prisma.usuario.update({
      where: { id_usuario: id },
      data,
      select: SELECT_FIELDS,
    });
  }

  async resetSenha(id: number, novaSenha: string) {
    await this.findOne(id);
    const senha_hash = await bcrypt.hash(novaSenha, 12);
    await this.prisma.usuario.update({
      where: { id_usuario: id },
      data: { senha_hash },
    });
    return { message: `Senha do usuário ${id} redefinida com sucesso` };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.usuario.delete({ where: { id_usuario: id } });
    return { message: `Usuário ${id} removido com sucesso` };
  }
}
