import { Module } from '@nestjs/common';
import { FrequenciaController } from './frequencia.controller';
import { FrequenciaService } from './frequencia.service';

@Module({
  controllers: [FrequenciaController],
  providers: [FrequenciaService],
})
export class FrequenciaModule {}
