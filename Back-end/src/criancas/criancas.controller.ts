import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CriancasService } from './criancas.service';
import { CreateCriancaDto } from './dto/create-crianca.dto';
import { UpdateCriancaDto } from './dto/update-crianca.dto';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('criancas')
@ApiBearerAuth()
@Controller('criancas')
export class CriancasController {
  constructor(private readonly service: CriancasService) {}

  @Get()
  @Roles(1)
  @ApiOperation({ summary: 'Listar todas as crianças' })
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.service.findAll(includeInactive === 'true');
  }

  @Get('busca')
  @Roles(1)
  @ApiOperation({ summary: 'Buscar criança por nome ou matrícula' })
  @ApiQuery({ name: 'nome', required: false })
  @ApiQuery({ name: 'matricula', required: false, type: Number })
  search(@Query('nome') nome?: string, @Query('matricula') matricula?: string) {
    return this.service.search(nome, matricula ? parseInt(matricula) : undefined);
  }

  @Get(':id')
  @Roles(1)
  @ApiOperation({ summary: 'Buscar criança por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Post()
  @Roles(2)
  @ApiOperation({ summary: 'Cadastrar nova criança' })
  create(@Body() dto: CreateCriancaDto) { return this.service.create(dto); }

  @Patch(':id')
  @Roles(2)
  @ApiOperation({ summary: 'Atualizar criança' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCriancaDto) { return this.service.update(id, dto); }

  @Delete(':id')
  @Roles(3)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover criança' })
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
