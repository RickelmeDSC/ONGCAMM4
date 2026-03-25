import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ResponsaveisService } from './responsaveis.service';
import { CreateResponsavelDto } from './dto/create-responsavel.dto';
import { UpdateResponsavelDto } from './dto/update-responsavel.dto';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('responsaveis')
@ApiBearerAuth()
@Controller('responsaveis')
export class ResponsaveisController {
  constructor(private readonly service: ResponsaveisService) {}

  @Get()
  @Roles(1)
  @ApiOperation({ summary: 'Listar todos os responsáveis' })
  findAll() { return this.service.findAll(); }

  @Get(':id')
  @Roles(1)
  @ApiOperation({ summary: 'Buscar responsável por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Post()
  @Roles(2)
  @ApiOperation({ summary: 'Cadastrar novo responsável' })
  create(@Body() dto: CreateResponsavelDto) { return this.service.create(dto); }

  @Patch(':id')
  @Roles(2)
  @ApiOperation({ summary: 'Atualizar responsável' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateResponsavelDto) { return this.service.update(id, dto); }

  @Delete(':id')
  @Roles(3)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover responsável' })
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
