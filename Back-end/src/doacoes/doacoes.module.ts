import { Module } from '@nestjs/common';
import { DoacoesController } from './doacoes.controller';
import { DoacoesService } from './doacoes.service';

@Module({
  controllers: [DoacoesController],
  providers: [DoacoesService],
})
export class DoacoesModule {}
