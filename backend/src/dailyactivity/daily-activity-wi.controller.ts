import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Body, 
  Param, 
  ParseIntPipe, 
  Query, 
  UseGuards, 
  Request,
  BadRequestException,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DailyActivityServiceWi, PickQuantitiesDto, UpdateRemainingDto } from './daily-activity-wi.service';

@Controller('daily-activity-wi')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DailyActivityControllerWi {
  constructor(private dailyActivityService: DailyActivityServiceWi) {}

  // ✅ Morning: Worker picks quantities (WORKER role)
  @Post('pick-quantities')
  @HttpCode(HttpStatus.OK)
  @Roles('WORKER')
  async updatePickedQuantities(@Body() pickDto: PickQuantitiesDto, @Request() req) {
    try {
      // Validate request body
      if (!pickDto.pickItems || !Array.isArray(pickDto.pickItems) || pickDto.pickItems.length === 0) {
        throw new BadRequestException('pickItems array is required and cannot be empty');
      }

      // Use logged-in worker's ID if not provided or if worker role
      const workerId = req.user.role === 'WORKER' ? req.user.workerId : (pickDto.workerId || req.user.workerId);
      
      // Validate each pick item
      for (const item of pickDto.pickItems) {
        if (!item.inventoryId || typeof item.inventoryId !== 'number') {
          throw new BadRequestException('Each pick item must have a valid inventoryId');
        }
        if (item.totalPickedQuantity === undefined || typeof item.totalPickedQuantity !== 'number' || item.totalPickedQuantity < 0) {
          throw new BadRequestException('Each pick item must have a valid totalPickedQuantity (>= 0)');
        }
      }

      const result = await this.dailyActivityService.updatePickedQuantities({
        ...pickDto,
        workerId
      });

      return {
        success: true,
        message: `Successfully updated picked quantities for ${result.length} products`,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }

  // ✅ Evening: Worker updates remaining quantities (WORKER role)
  @Put('remaining-quantities')
  @HttpCode(HttpStatus.OK)
  @Roles('WORKER')
  async updateRemainingQuantities(@Body() remainingDto: UpdateRemainingDto, @Request() req) {
    try {
      // Validate request body
      if (!remainingDto.remainingItems || !Array.isArray(remainingDto.remainingItems) || remainingDto.remainingItems.length === 0) {
        throw new BadRequestException('remainingItems array is required and cannot be empty');
      }

      // Use logged-in worker's ID if not provided or if worker role
      const workerId = req.user.role === 'WORKER' ? req.user.workerId : (remainingDto.workerId || req.user.workerId);
      
      // Validate each remaining item
      for (const item of remainingDto.remainingItems) {
        if (!item.inventoryId || typeof item.inventoryId !== 'number') {
          throw new BadRequestException('Each remaining item must have a valid inventoryId');
        }
        if (item.remainingQuantity === undefined || typeof item.remainingQuantity !== 'number' || item.remainingQuantity < 0) {
          throw new BadRequestException('Each remaining item must have a valid remainingQuantity (>= 0)');
        }
      }

      const result = await this.dailyActivityService.updateRemainingQuantities({
        ...remainingDto,
        workerId
      });

      return {
        success: true,
        message: `Successfully updated remaining quantities for ${result.length} products`,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }

  // ✅ Get worker's daily activity (WORKER can see their own, ADMIN can see any)
  @Get('worker/:workerId')
  @Roles('WORKER', 'ADMIN')
  async getWorkerDailyActivity(
    @Param('workerId', ParseIntPipe) workerId: number,
    @Query('date') date?: string,
    @Request() req?
  ) {
    try {
      // Workers can only see their own data
      if (req.user.role === 'WORKER' && req.user.workerId !== workerId) {
        return {
          success: false,
          message: 'Access denied. Workers can only view their own activity.',
          data: []
        };
      }

      const targetDate = date ? new Date(date) : new Date();
      
      // Validate date
      if (date && isNaN(targetDate.getTime())) {
        throw new BadRequestException('Invalid date format. Use YYYY-MM-DD format.');
      }

      const data = await this.dailyActivityService.getWorkerDailyActivity(workerId, targetDate);

      return {
        success: true,
        message: `Daily activity for worker ${workerId} on ${targetDate.toDateString()} retrieved successfully`,
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




  // ✅ Get daily summary for worker
  @Get('summary/:workerId')
  @Roles('WORKER', 'ADMIN')
  async getWorkerDailySummary(
    @Param('workerId', ParseIntPipe) workerId: number,
    @Query('date') date?: string,
    @Request() req?
  ) {
    try {
      // Workers can only see their own summary
      if (req.user.role === 'WORKER' && req.user.workerId !== workerId) {
        return {
          success: false,
          message: 'Access denied. Workers can only view their own summary.',
          data: null
        };
      }

      const targetDate = date ? new Date(date) : new Date();
      
      // Validate date
      if (date && isNaN(targetDate.getTime())) {
        throw new BadRequestException('Invalid date format. Use YYYY-MM-DD format.');
      }

      const data = await this.dailyActivityService.getWorkerDailySummary(workerId, targetDate);

      return {
        success: true,
        message: `Daily summary for worker ${workerId} on ${targetDate.toDateString()} retrieved successfully`,
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

  

  // ✅ Get worker activity history (multiple days)
  @Get('history/:workerId')
  @Roles('WORKER', 'ADMIN')
  async getWorkerActivityHistory(
    @Param('workerId', ParseIntPipe) workerId: number,
    @Query('days') days?: string,
    @Request() req?
  ) {
    try {
      // Workers can only see their own history
      if (req.user.role === 'WORKER' && req.user.workerId !== workerId) {
        return {
          success: false,
          message: 'Access denied. Workers can only view their own history.',
          data: {}
        };
      }

      const numDays = days ? parseInt(days) : 7;
      
      // Validate days parameter
      if (numDays < 1 || numDays > 30) {
        throw new BadRequestException('Days parameter must be between 1 and 30');
      }

      const data = await this.dailyActivityService.getWorkerActivityHistory(workerId, numDays);

      return {
        success: true,
        message: `Activity history for worker ${workerId} (last ${numDays} days) retrieved successfully`,
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

  
}
