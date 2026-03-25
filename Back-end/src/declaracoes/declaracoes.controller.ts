import { Controller, Get, Post, Body, Param, ParseIntPipe, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { DeclaracoesService } from './declaracoes.service';
import { CreateDeclaracaoDto } from './dto/create-declaracao.dto';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('declaracoes')
@ApiBearerAuth()
@Controller('declaracoes')
export class DeclaracoesController {
  constructor(private readonly service: DeclaracoesService) {}

  @Get()
  @Roles(2)
  @ApiOperation({ summary: 'Listar todas as declarações' })
  findAll() { return this.service.findAll(); }

  @Get(':id')
  @Roles(2)
  @ApiOperation({ summary: 'Buscar declaração por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Post()
  @Roles(3)
  @ApiOperation({ summary: 'Emitir nova declaração (somente Diretor)' })
  create(@Body() dto: CreateDeclaracaoDto) { return this.service.create(dto); }

  @Get(':id/pdf')
  @Roles(2)
  @ApiOperation({ summary: 'Gerar PDF da declaração' })
  async getPdf(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const buffer = await this.service.gerarPdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="declaracao-${id}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
