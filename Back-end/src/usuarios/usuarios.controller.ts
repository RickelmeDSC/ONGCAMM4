import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { ResetSenhaDto } from './dto/reset-senha.dto';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('usuarios')
@ApiBearerAuth()
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  @Roles(2)
  @ApiOperation({ summary: 'Listar todos os usuários' })
  findAll() {
    return this.usuariosService.findAll();
  }

  @Get(':id')
  @Roles(2)
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.findOne(id);
  }

  @Post()
  @Roles(2)
  @ApiOperation({ summary: 'Criar novo usuário' })
  create(@Body() dto: CreateUsuarioDto) {
    return this.usuariosService.create(dto);
  }

  @Patch(':id')
  @Roles(2)
  @ApiOperation({ summary: 'Atualizar usuário' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUsuarioDto) {
    return this.usuariosService.update(id, dto);
  }

  @Patch(':id/reset-senha')
  @Roles(3)
  @ApiOperation({ summary: 'Redefinir senha de um usuário (somente Diretor)' })
  resetSenha(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResetSenhaDto,
  ) {
    return this.usuariosService.resetSenha(id, dto.nova_senha);
  }

  @Delete(':id')
  @Roles(2)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover usuário' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.remove(id);
  }
}
