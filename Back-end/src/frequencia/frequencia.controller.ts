import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FrequenciaService } from './frequencia.service';
import { CreateFrequenciaDto } from './dto/create-frequencia.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class UpdateFrequenciaDto {
  @ApiProperty({ example: 'Presente', enum: ['Presente', 'Ausente'] })
  @IsIn(['Presente', 'Ausente'])
  status: string;
}

@ApiTags('frequencia')
@ApiBearerAuth()
@Controller('frequencia')
export class FrequenciaController {
  constructor(private readonly service: FrequenciaService) {}

  @Get()
  @Roles(1)
  @ApiOperation({ summary: 'Listar todos os registros de frequência' })
  findAll() { return this.service.findAll(); }

  @Get('crianca/:id')
  @Roles(1)
  @ApiOperation({ summary: 'Histórico de frequência por criança' })
  findByCrianca(@Param('id', ParseIntPipe) id: number) { return this.service.findByCrianca(id); }

  @Get('data/:data')
  @Roles(1)
  @ApiOperation({ summary: 'Frequência de uma data específica (YYYY-MM-DD)' })
  findByData(@Param('data') data: string) { return this.service.findByData(data); }

  @Post()
  @Roles(1)
  @ApiOperation({ summary: 'Registrar presença/ausência' })
  create(@Body() dto: CreateFrequenciaDto) { return this.service.create(dto); }

  @Patch(':id')
  @Roles(2)
  @ApiOperation({ summary: 'Corrigir registro de frequência' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFrequenciaDto) { return this.service.update(id, dto.status); }

  @Delete(':id')
  @Roles(3)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover registro de frequência' })
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
