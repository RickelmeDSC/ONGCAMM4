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
  async gerarCriancas(@Res() res: Response) {
    const buffer = await this.service.gerarCriancasBuffer();
    this.sendPdf(res, buffer, 'relatorio-criancas');
  }

  @Post('frequencia')
  @Roles(2)
  @ApiOperation({ summary: 'Gerar relatório de frequência em PDF' })
  async gerarFrequencia(@Res() res: Response) {
    const buffer = await this.service.gerarFrequenciaBuffer();
    this.sendPdf(res, buffer, 'relatorio-frequencia');
  }

  @Post('doacoes')
  @Roles(2)
  @ApiOperation({ summary: 'Gerar relatório de doações em PDF' })
  async gerarDoacoes(@Res() res: Response) {
    const buffer = await this.service.gerarDoacoesBuffer();
    this.sendPdf(res, buffer, 'relatorio-doacoes');
  }

  @Post('atividades')
  @Roles(2)
  @ApiOperation({ summary: 'Gerar relatório de atividades em PDF' })
  async gerarAtividades(@Res() res: Response) {
    const buffer = await this.service.gerarAtividadesBuffer();
    this.sendPdf(res, buffer, 'relatorio-atividades');
  }

  @Post('auditoria')
  @Roles(3)
  @ApiOperation({ summary: 'Gerar relatório de auditoria em PDF' })
  async gerarAuditoria(@Res() res: Response) {
    const buffer = await this.service.gerarAuditoriaBuffer();
    this.sendPdf(res, buffer, 'relatorio-auditoria');
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
