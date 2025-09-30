import { Controller, Get, Query, HttpStatus, HttpCode } from '@nestjs/common';
import { DataVerificationService } from './data-verification.service';

@Controller('data-verification')
export class DataVerificationController {
  constructor(private readonly dailyDeliveriesService: DataVerificationService) {}

  @Get('overview')
  @HttpCode(HttpStatus.OK)
  async getDailyDeliveriesOverview(@Query('date') date?: string) {
    try {
      const targetDate = date ? new Date(date) : new Date();
      const result = await this.dailyDeliveriesService.getDailyDeliveriesOverview(targetDate);

      return {
        success: true,
        message: 'Daily deliveries overview retrieved successfully',
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get daily deliveries overview',
        data: null
      };
    }
  }

  @Get('cash-summary')
  @HttpCode(HttpStatus.OK)
  async getDailySummary(@Query('date') date?: string) {
    try {
      const targetDate = date ? new Date(date) : new Date();
      const result = await this.dailyDeliveriesService.getWorkerCashSummary(targetDate);

      return {
        success: true,
        message: 'Worker cash summary retrieved successfully',
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get worker cash summary',
        data: null
      };
    }
  }
}
