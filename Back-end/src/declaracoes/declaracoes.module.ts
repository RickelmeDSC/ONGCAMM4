import { Module } from '@nestjs/common';
import { DeclaracoesController } from './declaracoes.controller';
import { DeclaracoesService } from './declaracoes.service';

@Module({
  controllers: [DeclaracoesController],
  providers: [DeclaracoesService],
})
export class DeclaracoesModule {}
