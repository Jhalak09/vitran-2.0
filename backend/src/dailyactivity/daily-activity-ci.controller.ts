import { 
  Controller, 
  Get, 
  Param, 
  ParseIntPipe, 
  Query, 
  UseGuards, 
  Request,
  BadRequestException,
  ParseBoolPipe
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DailyActivityCiService } from './daily-activity-ci.service';

@Controller('daily-activity-ci')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DailyActivityCiController {
  constructor(private dailyActivityCiService: DailyActivityCiService) {}


  // ✅ Get my customer assignments (for logged-in worker)
@Get('my-customers')
@Roles('WORKER')
async getMyCustomers(@Request() req) {
  try {
    const data = await this.dailyActivityCiService.getWorkerCustomers(req.user.workerId);

    return {
      success: true,
      message: 'Your customer assignments retrieved successfully',
      data
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      data: []
    };
  }
}

  
  // ✅ Get my inventory with product details (for logged-in worker)
  @Get('my-inventory')
  @Roles('WORKER')
  async getMyInventoryWithProducts(
    @Request() req,
    @Query('date') date?: string
  ) {
    try {
      const targetDate = date ? new Date(date) : new Date();
      
      // Validate date
      if (date && isNaN(targetDate.getTime())) {
        throw new BadRequestException('Invalid date format. Use YYYY-MM-DD format.');
      }

      const data = await this.dailyActivityCiService.getWorkerInventoryWithProducts(req.user.workerId, targetDate);

      return {
        success: true,
        message: `Your inventory with product details for ${targetDate.toDateString()} retrieved successfully`,
        data
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: []
      };
    }
  }



  // ✅ Get my inventory summary (for logged-in worker)
  @Get('my-inventory-summary')
  @Roles('WORKER')
  async getMyInventorySummary(
    @Request() req,
    @Query('date') date?: string
  ) {
    try {
      const targetDate = date ? new Date(date) : new Date();
      
      // Validate date
      if (date && isNaN(targetDate.getTime())) {
        throw new BadRequestException('Invalid date format. Use YYYY-MM-DD format.');
      }

      const data = await this.dailyActivityCiService.getWorkerInventorySummary(req.user.workerId, targetDate);

      return {
        success: true,
        message: `Your inventory summary for ${targetDate.toDateString()} retrieved successfully`,
        data
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }
}
