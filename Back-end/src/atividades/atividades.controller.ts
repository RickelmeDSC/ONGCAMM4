import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AtividadesService } from './atividades.service';
import { CreateAtividadeDto } from './dto/create-atividade.dto';
import { UpdateAtividadeDto } from './dto/update-atividade.dto';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('atividades')
@ApiBearerAuth()
@Controller('atividades')
export class AtividadesController {
  constructor(private readonly service: AtividadesService) {}

  @Get()
  @Roles(1)
  @ApiOperation({ summary: 'Listar todas as atividades' })
  findAll() { return this.service.findAll(); }

  @Get(':id')
  @Roles(1)
  @ApiOperation({ summary: 'Buscar atividade por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Post()
  @Roles(2)
  @ApiOperation({ summary: 'Registrar nova atividade' })
  create(@Body() dto: CreateAtividadeDto) { return this.service.create(dto); }

  @Patch(':id')
  @Roles(2)
  @ApiOperation({ summary: 'Atualizar atividade' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAtividadeDto) { return this.service.update(id, dto); }

  @Delete(':id')
  @Roles(3)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover atividade' })
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
