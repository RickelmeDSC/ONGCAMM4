import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditoriaService } from './auditoria.service';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('auditoria')
@ApiBearerAuth()
@Roles(3)
@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly service: AuditoriaService) {}

  @Get('logs')
  @ApiOperation({ summary: 'Listar todos os logs do sistema' })
  findAll() { return this.service.findAll(); }

  @Get('logs/usuario/:id')
  @ApiOperation({ summary: 'Logs por usuário específico' })
  findByUsuario(@Param('id') id: string) { return this.service.findByUsuario(+id); }

  @Get('logs/periodo')
  @ApiOperation({ summary: 'Logs em intervalo de datas' })
  @ApiQuery({ name: 'inicio', required: true, example: '2026-01-01' })
  @ApiQuery({ name: 'fim', required: true, example: '2026-12-31' })
  findByPeriodo(@Query('inicio') inicio: string, @Query('fim') fim: string) {
    return this.service.findByPeriodo(inicio, fim);
  }
}
