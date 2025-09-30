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
  // Add this helper method at the top of the class
private createDateFromString(dateInput?: Date | string): Date {
  if (!dateInput) {
    // Use current date in IST
    const now = new Date();
    const todayString = now.getFullYear() + '-' + 
                       String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(now.getDate()).padStart(2, '0');
    return new Date(todayString + 'T00:00:00.000Z');
  }
  
  if (typeof dateInput === 'string') {
    return new Date(dateInput + 'T00:00:00.000Z');
  }
  
  // If it's a Date object, normalize it to start of day
  const dateStr = dateInput.getFullYear() + '-' + 
                  String(dateInput.getMonth() + 1).padStart(2, '0') + '-' + 
                  String(dateInput.getDate()).padStart(2, '0');
  return new Date(dateStr + 'T00:00:00.000Z');
}

/**
 * Calculate total ordered quantity for a specific product based on active customer subscriptions
 */
async calculateProductDemand(productId: number, referenceDate?: Date): Promise<number> {
  try {
    // Use current date or provided reference date for comparison
    const compareDate = referenceDate || new Date();
    
    const result = await this.prisma.customerProduct.aggregate({
      where: {
        productId,
        OR: [
          { thruDate: null },
          { thruDate: { gt: compareDate } }
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

async storeDailyDemand(date?: Date): Promise<{count: number}> {
  const targetDate = this.createDateFromString(date);
  let count = 0;

  const products = await this.prisma.product.findMany({
    select: { productId: true }
  });

  for (const product of products) {
    const demand = await this.calculateProductDemand(product.productId, targetDate);
    
    await this.prisma.productDemand.upsert({
      where: { productId_date: { productId: product.productId, date: targetDate } },
      update: { totalDemand: demand },
      create: { productId: product.productId, totalDemand: demand, date: targetDate }
    });
    count++;
  }
  
  return { count };
}


/**
 * Get inventory summary for a specific date
 */
async getInventory(date?: Date): Promise<any[]> {
  const targetDate = this.createDateFromString(date);

  return this.prisma.inventory.findMany({
    where: { date: targetDate },
    include: {
    }
  });
}


/**
 * Update received quantity (admin input)
 */
async updateReceivedQuantity(productId: number, receivedQty: number, date: Date | string, userId: string): Promise<void> {
  try {
    const targetDate = this.createDateFromString(date);
    
    this.logger.log(`Updating received quantity for product ${productId} on ${targetDate.toISOString()}: ${receivedQty}`);
    const newInventory = await this.prisma.inventory.create({
        data: {
          productId,
          receivedQuantity: receivedQty,
          remainingQuantity: null, // Will be filled later
          entryByUserLoginId: userId,
          lastUpdated: new Date(),
          date: targetDate
        }
      });
      this.logger.log(`Created new inventory record ${newInventory.inventoryId} for product ${productId}: ${receivedQty}`);
    

    this.logger.log(`Successfully processed received quantity for product ${productId} on ${targetDate.toDateString()}: ${receivedQty}`);
  } catch (error) {
    this.logger.error(`Error updating received quantity for product ${productId}:`, error);
    throw error;
  }
    
}

/**
 * Update remaining quantity (end of day admin input)
 */
async updateRemainingQuantity(productId: number, remainingQty: number, date: Date | string, userId: string): Promise<void> {
  try {
    const targetDate = this.createDateFromString(date);
    
    this.logger.log(`Updating remaining quantity for product ${productId} on ${targetDate.toISOString()}: ${remainingQty}`);

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


 async getAllProductDemand(date?: Date): Promise<{demands: any[], wasCalculated: boolean}> {
    const targetDate = this.createDateFromString(date);
    
    this.logger.log(`Getting all product demand for ${targetDate.toDateString()}`);

    // First, check if demand data exists for this date
    const existingDemands = await this.prisma.productDemand.findMany({
      where: { date: targetDate },
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
      orderBy: { totalDemand: 'desc' }
    });

    // If demand data exists, return it
    if (existingDemands.length > 0) {
      this.logger.log(`Found existing demand data: ${existingDemands.length} products`);
      return {
        demands: existingDemands,
        wasCalculated: false
      };
    }

    // If no demand data exists, calculate it first
    this.logger.log(`No demand data found for ${targetDate.toDateString()}, calculating now...`);
    
    await this.storeDailyDemand(targetDate);

    // Fetch the newly calculated demand data
    const newDemands = await this.prisma.productDemand.findMany({
      where: { date: targetDate },
      
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
      orderBy: { totalDemand: 'desc' }
    });

    this.logger.log(`Calculated and stored demand for ${newDemands.length} products`);
    
    return {
      demands: newDemands,
      wasCalculated: true
    };
  }


}
