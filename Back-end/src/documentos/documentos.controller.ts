import { Controller, Post, Get, Param, ParseIntPipe, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { DocumentosService } from './documentos.service';
import { multerConfig } from './upload.config';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('documentos')
@ApiBearerAuth()
@Controller('documentos')
export class DocumentosController {
  constructor(private readonly service: DocumentosService) {}

  @Post('upload/foto/:id')
  @Roles(1)
  @UseInterceptors(FileInterceptor('file', multerConfig('fotos')))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: 'Upload de foto da criança' })
  uploadFoto(@Param('id', ParseIntPipe) id: number, @UploadedFile() file: Express.Multer.File) {
    return this.service.uploadFoto(id, file.filename);
  }

  @Post('upload/certidao/:id')
  @Roles(1)
  @UseInterceptors(FileInterceptor('file', multerConfig('certidoes')))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: 'Upload de certidão de nascimento' })
  uploadCertidao(@Param('id', ParseIntPipe) id: number, @UploadedFile() file: Express.Multer.File) {
    return this.service.uploadCertidao(id, file.filename);
  }

  @Post('upload/vacina/:id')
  @Roles(1)
  @UseInterceptors(FileInterceptor('file', multerConfig('cartoes-vacina')))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: 'Upload de cartão de vacina' })
  uploadVacina(@Param('id', ParseIntPipe) id: number, @UploadedFile() file: Express.Multer.File) {
    return this.service.uploadVacina(id, file.filename);
  }

  @Get(':id')
  @Roles(1)
  @ApiOperation({ summary: 'Listar documentos de uma criança' })
  getDocumentos(@Param('id', ParseIntPipe) id: number) {
    return this.service.getDocumentos(id);
  }
}
