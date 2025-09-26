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

  // ✅ FIXED: Function 1 - Get worker-wise customer details
  @Get('worker-customers/:workerId')
  @Roles('WORKER', 'ADMIN')
  async getWorkerCustomers(
    @Param('workerId', ParseIntPipe) workerId: number,
    @Request() req, // ✅ FIXED: Removed optional marker
    @Query('includeInactive', ParseBoolPipe) includeInactive: boolean = false
  ) {
    try {
      // Workers can only see their own customer assignments
      if (req.user.role === 'WORKER' && req.user.workerId !== workerId) {
        return {
          success: false,
          message: 'Access denied. Workers can only view their own customer assignments.',
          data: []
        };
      }

      const data = await this.dailyActivityCiService.getWorkerCustomers(workerId, includeInactive);

      return {
        success: true,
        message: `Customer assignments for worker ${workerId} retrieved successfully`,
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

  // ✅ Get my customer assignments (for logged-in worker)
  @Get('my-customers')
  @Roles('WORKER')
  async getMyCustomers(
    @Request() req,
    @Query('includeInactive', ParseBoolPipe) includeInactive: boolean = false
  ) {
    try {
      const data = await this.dailyActivityCiService.getWorkerCustomers(req.user.workerId, includeInactive);

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

  // ✅ FIXED: Function 2 - Get worker inventory with product details
  @Get('worker-inventory/:workerId')
  @Roles('WORKER', 'ADMIN')
  async getWorkerInventoryWithProducts(
    @Param('workerId', ParseIntPipe) workerId: number,
    @Request() req, // ✅ FIXED: Removed optional marker and moved before optional parameters
    @Query('date') date?: string
  ) {
    try {
      // Workers can only see their own inventory
      if (req.user.role === 'WORKER' && req.user.workerId !== workerId) {
        return {
          success: false,
          message: 'Access denied. Workers can only view their own inventory.',
          data: []
        };
      }

      const targetDate = date ? new Date(date) : new Date();
      
      // Validate date
      if (date && isNaN(targetDate.getTime())) {
        throw new BadRequestException('Invalid date format. Use YYYY-MM-DD format.');
      }

      const data = await this.dailyActivityCiService.getWorkerInventoryWithProducts(workerId, targetDate);

      return {
        success: true,
        message: `Inventory with product details for worker ${workerId} on ${targetDate.toDateString()} retrieved successfully`,
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

  // ✅ Additional: Get active customers for multiple workers (ADMIN only)
  @Get('workers-customers')
  @Roles('ADMIN')
  async getActiveCustomersForWorkers(@Query('workerIds') workerIds: string) {
    try {
      if (!workerIds) {
        throw new BadRequestException('workerIds query parameter is required (comma-separated list)');
      }

      const workerIdArray = workerIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      
      if (workerIdArray.length === 0) {
        throw new BadRequestException('Please provide valid worker IDs');
      }

      const data = await this.dailyActivityCiService.getActiveCustomersForWorkers(workerIdArray);

      return {
        success: true,
        message: `Customer assignments for ${workerIdArray.length} workers retrieved successfully`,
        data
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: {}
      };
    }
  }

  // ✅ FIXED: Additional - Get worker inventory summary
  @Get('inventory-summary/:workerId')
  @Roles('WORKER', 'ADMIN')
  async getWorkerInventorySummary(
    @Param('workerId', ParseIntPipe) workerId: number,
    @Request() req, // ✅ FIXED: Removed optional marker and moved before optional parameters
    @Query('date') date?: string
  ) {
    try {
      // Workers can only see their own summary
      if (req.user.role === 'WORKER' && req.user.workerId !== workerId) {
        return {
          success: false,
          message: 'Access denied. Workers can only view their own inventory summary.',
          data: null
        };
      }

      const targetDate = date ? new Date(date) : new Date();
      
      // Validate date
      if (date && isNaN(targetDate.getTime())) {
        throw new BadRequestException('Invalid date format. Use YYYY-MM-DD format.');
      }

      const data = await this.dailyActivityCiService.getWorkerInventorySummary(workerId, targetDate);

      return {
        success: true,
        message: `Inventory summary for worker ${workerId} on ${targetDate.toDateString()} retrieved successfully`,
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
