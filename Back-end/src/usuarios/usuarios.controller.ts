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
  @Roles(3)
  @ApiOperation({ summary: 'Criar novo usuário' })
  create(@Body() dto: CreateUsuarioDto) {
    return this.usuariosService.create(dto);
  }

  @Patch(':id')
  @Roles(3)
  @ApiOperation({ summary: 'Atualizar usuário' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUsuarioDto) {
    return this.usuariosService.update(id, dto);
  }

  @Delete(':id')
  @Roles(3)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover usuário' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.remove(id);
  }
}
