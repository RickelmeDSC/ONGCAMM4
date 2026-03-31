import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Retorna métricas agregadas para o dashboard' })
  getMetrics() {
    return this.service.getMetrics();
  }
}
