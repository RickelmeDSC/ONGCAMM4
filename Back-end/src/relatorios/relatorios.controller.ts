import { Controller, Get, Post, Res, Query, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { RelatoriosService } from './relatorios.service';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('relatorios')
@ApiBearerAuth()
@Controller('relatorios')
export class RelatoriosController {
  constructor(private readonly service: RelatoriosService) {}

  @Post('criancas')
  @Roles(2)
  @ApiOperation({ summary: 'Gerar relatório de crianças cadastradas em PDF' })
  async gerarCriancas(@Res() res: Response) {
    try {
      const buffer = await this.service.gerarCriancasBuffer();
      this.sendPdf(res, buffer, 'relatorio-criancas');
    } catch (err) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Erro ao gerar PDF de crianças', error: err.message });
    }
  }

  @Post('frequencia')
  @Roles(2)
  @ApiOperation({ summary: 'Gerar relatório de frequência em PDF' })
  @ApiQuery({ name: 'data', required: false, description: 'Data no formato YYYY-MM-DD' })
  @ApiQuery({ name: 'turno', required: false, description: 'Manhã, Tarde ou Integral' })
  async gerarFrequencia(
    @Res() res: Response,
    @Query('data') data?: string,
    @Query('turno') turno?: string,
  ) {
    try {
      const buffer = await this.service.gerarFrequenciaBuffer(data, turno);
      this.sendPdf(res, buffer, 'relatorio-frequencia');
    } catch (err) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Erro ao gerar PDF de frequência', error: err.message });
    }
  }

  @Post('doacoes')
  @Roles(2)
  @ApiOperation({ summary: 'Gerar relatório de doações em PDF' })
  async gerarDoacoes(@Res() res: Response) {
    try {
      const buffer = await this.service.gerarDoacoesBuffer();
      this.sendPdf(res, buffer, 'relatorio-doacoes');
    } catch (err) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Erro ao gerar PDF de doações', error: err.message });
    }
  }

  @Post('atividades')
  @Roles(2)
  @ApiOperation({ summary: 'Gerar relatório de atividades em PDF' })
  async gerarAtividades(@Res() res: Response) {
    try {
      const buffer = await this.service.gerarAtividadesBuffer();
      this.sendPdf(res, buffer, 'relatorio-atividades');
    } catch (err) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Erro ao gerar PDF de atividades', error: err.message });
    }
  }

  @Post('auditoria')
  @Roles(3)
  @ApiOperation({ summary: 'Gerar relatório de auditoria em PDF' })
  async gerarAuditoria(@Res() res: Response) {
    try {
      const buffer = await this.service.gerarAuditoriaBuffer();
      this.sendPdf(res, buffer, 'relatorio-auditoria');
    } catch (err) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Erro ao gerar PDF de auditoria', error: err.message });
    }
  }

  private sendPdf(res: Response, buffer: Buffer, name: string) {
    const date = new Date().toISOString().slice(0, 10);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${name}-${date}.pdf"`,
      'Content-Length': buffer.length.toString(),
    });
    res.end(buffer);
  }
}
