// inventory-helper.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryHelper {
  private readonly logger = new Logger(InventoryHelper.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Calculate total ordered quantity for a specific product based on active customer subscriptions
   */
  async calculateProductDemand(productId: number): Promise<number> {
    try {
      const result = await this.prisma.customerProduct.aggregate({
        where: {
          productId,
          OR: [
            { thruDate: null },
            { thruDate: { gt: new Date() } }
          ]
        },
        _sum: { quantityAssociated: true }
      });

      return result._sum.quantityAssociated || 0;
    } catch (error) {
      this.logger.error(`Error calculating demand for product ${productId}:`, error);
      return 0;
    }
  }

  /**
   * Update inventory for a specific product on a specific date
   */
  async updateProductInventory(productId: number, date?: Date, userId?: string): Promise<void> {
    try {
      const totalDemand = await this.calculateProductDemand(productId);
      const targetDate = date || new Date();
      targetDate.setHours(0, 0, 0, 0); // Start of day

      // Check if inventory record exists for this date
      const existingInventory = await this.prisma.inventory.findUnique({
        where: {
          productId_date: {
            productId,
            date: targetDate
          }
        }
      });

      if (existingInventory) {
        // Update existing inventory
        await this.prisma.inventory.update({
          where: { inventoryId: existingInventory.inventoryId },
          data: {
            totalOrderedQuantity: totalDemand,
            lastUpdated: new Date(),
            entryByUserLoginId: userId || existingInventory.entryByUserLoginId,
          }
        });

        this.logger.log(`Updated inventory for product ${productId} on ${targetDate.toDateString()}: demand=${totalDemand}`);
      } else {
        // Create new inventory record for this date
        await this.prisma.inventory.create({
          data: {
            productId,
            totalOrderedQuantity: totalDemand,
            lastUpdated: new Date(),
            entryByUserLoginId: userId,
            date: targetDate
          }
        });

        this.logger.log(`Created inventory for product ${productId} on ${targetDate.toDateString()}: demand=${totalDemand}`);
      }
    } catch (error) {
      this.logger.error(`Error updating inventory for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Update inventory for all products on a specific date
   */
  async updateAllProductInventories(date?: Date, userId?: string): Promise<{updatedCount: number, errors: string[]}> {
    const errors: string[] = [];
    let updatedCount = 0;

    try {
      // Get all unique product IDs that have active customer subscriptions
      const activeProductIds = await this.prisma.customerProduct.findMany({
        where: {
          productId: { not: null },
          OR: [
            { thruDate: null },
            { thruDate: { gt: new Date() } }
          ]
        },
        select: { productId: true },
        distinct: ['productId']
      });

      this.logger.log(`Found ${activeProductIds.length} products with active subscriptions`);

      // Update inventory for each product
      for (const { productId } of activeProductIds) {
        if (productId) {
          try {
            await this.updateProductInventory(productId, date, userId);
            updatedCount++;
          } catch (error) {
            const errorMsg = `Failed to update product ${productId}: ${error.message}`;
            errors.push(errorMsg);
            this.logger.error(errorMsg);
          }
        }
      }

      this.logger.log(`Successfully updated ${updatedCount} product inventories`);
      return { updatedCount, errors };
    } catch (error) {
      this.logger.error('Error in updateAllProductInventories:', error);
      throw error;
    }
  }

  /**
   * Get inventory summary for a specific date
   */
  async getInventorySummary(date?: Date): Promise<any[]> {
    const targetDate = date || new Date();
    targetDate.setHours(0, 0, 0, 0);

    return this.prisma.inventory.findMany({
      where: {
        date: targetDate
      },
      include: {
        product: {
          select: {
            productId: true,
            productName: true,
            currentProductPrice: true,
            storeId: true,
            imageUrl: true
          }
        }
      },
      orderBy: { totalOrderedQuantity: 'desc' }
    });
  }

  /**
   * Update received quantity (admin input)
   */
  async updateReceivedQuantity(productId: number, receivedQty: number, date: Date, userId: string): Promise<void> {
    try {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);

      const inventory = await this.prisma.inventory.findUnique({
        where: {
          productId_date: {
            productId,
            date: targetDate
          }
        }
      });

      if (!inventory) {
        throw new Error(`No inventory record found for product ${productId} on ${targetDate.toDateString()}`);
      }

      await this.prisma.inventory.update({
        where: { inventoryId: inventory.inventoryId },
        data: {
          receivedQuantity: receivedQty,
          entryByUserLoginId: userId,
          lastUpdated: new Date()
        }
      });

      this.logger.log(`Updated received quantity for product ${productId} on ${targetDate.toDateString()}: ${receivedQty}`);
    } catch (error) {
      this.logger.error(`Error updating received quantity for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Update remaining quantity (end of day admin input)
   */
  async updateRemainingQuantity(productId: number, remainingQty: number, date: Date, userId: string): Promise<void> {
    try {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);

      const inventory = await this.prisma.inventory.findUnique({
        where: {
          productId_date: {
            productId,
            date: targetDate
          }
        }
      });

      if (!inventory) {
        throw new Error(`No inventory record found for product ${productId} on ${targetDate.toDateString()}`);
      }

      await this.prisma.inventory.update({
        where: { inventoryId: inventory.inventoryId },
        data: {
          remainingQuantity: remainingQty,
          entryByUserLoginId: userId,
          lastUpdated: new Date()
        }
      });

      this.logger.log(`Updated remaining quantity for product ${productId} on ${targetDate.toDateString()}: ${remainingQty}`);
    } catch (error) {
      this.logger.error(`Error updating remaining quantity for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Get available dates for inventory (for date navigation)
   */
  async getAvailableDates(limit: number = 30): Promise<Date[]> {
    const result = await this.prisma.inventory.findMany({
      select: { date: true },
      distinct: ['date'],
      orderBy: { date: 'desc' },
      take: limit
    });

    return result.map(item => item.date);
  }

  /**
   * Initialize today's inventory (create records for all active products)
   */
 async initializeTodayInventory(userId?: string): Promise<{updatedCount: number, errors: string[]}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if today's inventory already exists
  const existingCount = await this.prisma.inventory.count({
    where: { date: today }
  });

  if (existingCount > 0) {
    return { updatedCount: 0, errors: [`Inventory for ${today.toDateString()} already exists`] };
  }

  // Create today's inventory - this will return the correct type
  return this.updateAllProductInventories(today, userId);
}
}
