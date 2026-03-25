import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DoacoesService } from './doacoes.service';
import { CreateDoacaoDto } from './dto/create-doacao.dto';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('doacoes')
@ApiBearerAuth()
@Controller('doacoes')
export class DoacoesController {
  constructor(private readonly service: DoacoesService) {}

  @Get()
  @Roles(2)
  @ApiOperation({ summary: 'Listar todas as doações' })
  findAll() { return this.service.findAll(); }

  @Get(':id')
  @Roles(2)
  @ApiOperation({ summary: 'Buscar doação por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Post()
  @Roles(2)
  @ApiOperation({ summary: 'Registrar nova doação' })
  create(@Body() dto: CreateDoacaoDto) { return this.service.create(dto); }

  @Patch(':id')
  @Roles(2)
  @ApiOperation({ summary: 'Atualizar doação' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateDoacaoDto) { return this.service.update(id, dto); }

  @Delete(':id')
  @Roles(3)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover doação' })
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
