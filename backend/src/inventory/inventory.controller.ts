import { Controller, Post, Get, Body, Param, ParseIntPipe, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { InventoryHelper } from './inventory-helper';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class InventoryController {
  constructor(private inventoryHelper: InventoryHelper) {}

  @Post('update-all')
  async updateAllInventories(@Body() body: { userId?: string; date?: string }) {
    try {
      const targetDate = body.date ? new Date(body.date) : new Date();
      const result = await this.inventoryHelper.updateAllProductInventories(targetDate, body.userId);
      return {
        success: true,
        message: `Updated ${result.updatedCount} product inventories for ${targetDate.toDateString()}`,
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

  @Post('initialize-today')
async initializeTodayInventory(@Body() body: { userId?: string }) {
  try {
    const result = await this.inventoryHelper.initializeTodayInventory(body.userId);
    return {
      success: true,
      message: `Initialized ${result.updatedCount} inventory records for today`,
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

  @Post('received/:productId')
  async updateReceivedQuantity(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() body: { receivedQuantity: number; userId: string; date?: string }
  ) {
    try {
      const targetDate = body.date ? new Date(body.date) : new Date();
      await this.inventoryHelper.updateReceivedQuantity(productId, body.receivedQuantity, targetDate, body.userId);
      return {
        success: true,
        message: `Updated received quantity for product ${productId} on ${targetDate.toDateString()}`
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // ✅ NEW: Update remaining quantity (end of day)
  @Post('remaining/:productId')
  async updateRemainingQuantity(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() body: { remainingQuantity: number; userId: string; date?: string }
  ) {
    try {
      const targetDate = body.date ? new Date(body.date) : new Date();
      await this.inventoryHelper.updateRemainingQuantity(productId, body.remainingQuantity, targetDate, body.userId);
      return {
        success: true,
        message: `Updated remaining quantity for product ${productId} on ${targetDate.toDateString()}`
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  @Get('summary')
  async getInventorySummary(@Query('date') date?: string) {
    try {
      const targetDate = date ? new Date(date) : new Date();
      const data = await this.inventoryHelper.getInventorySummary(targetDate);
      return {
        success: true,
        message: `Inventory summary for ${targetDate.toDateString()} retrieved successfully`,
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

  @Get('dates')
  async getAvailableDates() {
    try {
      const dates = await this.inventoryHelper.getAvailableDates();
      return {
        success: true,
        message: 'Available dates retrieved successfully',
        data: dates
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: []
      };
    }
  }
}
