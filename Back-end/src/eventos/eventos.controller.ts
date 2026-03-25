import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EventosService } from './eventos.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('eventos')
@ApiBearerAuth()
@Controller('eventos')
export class EventosController {
  constructor(private readonly service: EventosService) {}

  @Get()
  @Roles(1)
  @ApiOperation({ summary: 'Listar todos os eventos' })
  findAll() { return this.service.findAll(); }

  @Get(':id')
  @Roles(1)
  @ApiOperation({ summary: 'Buscar evento por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Post()
  @Roles(2)
  @ApiOperation({ summary: 'Registrar novo evento' })
  create(@Body() dto: CreateEventoDto) { return this.service.create(dto); }

  @Patch(':id')
  @Roles(2)
  @ApiOperation({ summary: 'Atualizar evento' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEventoDto) { return this.service.update(id, dto); }

  @Delete(':id')
  @Roles(3)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover evento' })
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
