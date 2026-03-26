import { Controller, Get, Post, Param, ParseIntPipe, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { RelatoriosService } from './relatorios.service';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('relatorios')
@ApiBearerAuth()
@Controller('relatorios')
export class RelatoriosController {
  constructor(private readonly service: RelatoriosService) {}

  @Get()
  @Roles(2)
  @ApiOperation({ summary: 'Listar relatórios gerados' })
  findAll() { return this.service.findAll(); }

  @Post('criancas')
  @Roles(2)
  @ApiOperation({ summary: 'Gerar relatório de crianças cadastradas em PDF' })
  gerarCriancas() { return this.service.gerarCriancas(); }

  @Post('frequencia')
  @Roles(2)
  @ApiOperation({ summary: 'Gerar relatório de frequência em PDF' })
  gerarFrequencia() { return this.service.gerarFrequencia(); }

  @Post('doacoes')
  @Roles(2)
  @ApiOperation({ summary: 'Gerar relatório de doações em PDF' })
  gerarDoacoes() { return this.service.gerarDoacoes(); }

  @Post('atividades')
  @Roles(2)
  @ApiOperation({ summary: 'Gerar relatório de atividades em PDF' })
  gerarAtividades() { return this.service.gerarAtividades(); }

  @Post('auditoria')
  @Roles(3)
  @ApiOperation({ summary: 'Gerar relatório de auditoria em PDF' })
  gerarAuditoria() { return this.service.gerarAuditoria(); }

  @Get(':id/download')
  @Roles(2)
  @ApiOperation({ summary: 'Download de um relatório gerado' })
  async download(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const { stream, path } = await this.service.download(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${path.split('/').pop()}"`,
    });
    stream.pipe(res);
  }
}
