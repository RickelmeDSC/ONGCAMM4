import { Module } from '@nestjs/common';
import { CriancasController } from './criancas.controller';
import { CriancasService } from './criancas.service';

@Module({
  controllers: [CriancasController],
  providers: [CriancasService],
  exports: [CriancasService],
})
export class CriancasModule {}
