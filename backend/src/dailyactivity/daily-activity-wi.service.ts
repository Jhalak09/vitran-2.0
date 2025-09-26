import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface PickQuantitiesDto {
  workerId: number;
  pickItems: Array<{
    inventoryId: number;
    totalPickedQuantity: number;
  }>;
}

export interface UpdateRemainingDto {
  workerId: number;
  remainingItems: Array<{
    inventoryId: number;
    remainingQuantity: number;
  }>;
}

export interface WorkerInventoryActivity {
  id: number;
  workerId: number;
  inventoryId: number;
  totalPickedQuantity: number | null;
  remainingQuantity: number | null;
  date: Date;
  worker: {
    workerId: number;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
  inventory: {
    inventoryId: number;
    totalOrderedQuantity: number;
    receivedQuantity: number | null;
    product: {
      productId: number;
      productName: string;
      currentProductPrice: number; // ✅ Keep as number - we'll convert Decimal to number
      storeId: string;
      imageUrl: string | null;
    };
  } | null;
}


@Injectable()
export class DailyActivityService {
  private readonly logger = new Logger(DailyActivityService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get start of day for consistent date comparisons
   */
  private getStartOfDay(date: Date = new Date()): Date {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    return startOfDay;
  }

  /**
   * Get end of day for date range queries
   */
  private getEndOfDay(date: Date): Date {
    return new Date(date.getTime() + 24 * 60 * 60 * 1000);
  }

  /**
   * Morning: Worker picks quantities for multiple products
   */
  async updatePickedQuantities(pickDto: PickQuantitiesDto) {
    const { workerId, pickItems } = pickDto;
    const today = this.getStartOfDay();

    if (!pickItems || pickItems.length === 0) {
      throw new BadRequestException('Pick items array is required and cannot be empty');
    }

    try {
      // Verify worker exists and is active
      const worker = await this.prisma.worker.findFirst({
        where: { workerId, isActive: true },
        select: { workerId: true, firstName: true, lastName: true }
      });

      if (!worker) {
        throw new NotFoundException('Worker not found or inactive');
      }

      // Process all pick items in a transaction
      const results = await this.prisma.$transaction(async (prisma) => {
        const updatedRecords = [];

        for (const item of pickItems) {
          const { inventoryId, totalPickedQuantity } = item;

          if (totalPickedQuantity < 0) {
            throw new BadRequestException(`Picked quantity cannot be negative for inventory ${inventoryId}`);
          }

          // Verify inventory exists for today
          const inventory = await prisma.inventory.findUnique({
            where: { inventoryId },
            include: {
              product: {
                select: { productName: true }
              }
            }
          });

          if (!inventory) {
            throw new NotFoundException(`Inventory record ${inventoryId} not found`);
          }

          // Check if worker inventory already exists for today
          const existingWorkerInventory = await prisma.workerInventory.findFirst({
            where: {
              workerId,
              inventoryId,
              date: {
                gte: today,
                lt: this.getEndOfDay(today)
              }
            }
          });

          let workerInventory;

          if (existingWorkerInventory) {
            // Update existing record for today
            workerInventory = await prisma.workerInventory.update({
              where: { id: existingWorkerInventory.id },
              data: {
                totalPickedQuantity,
                date: new Date() // Update timestamp to current time
              }
            });
            this.logger.log(`Updated picked quantity for worker ${workerId}, inventory ${inventoryId}: ${totalPickedQuantity}`);
          } else {
            // Create new record for today
            workerInventory = await prisma.workerInventory.create({
              data: {
                workerId,
                inventoryId,
                totalPickedQuantity,
                date: new Date()
              }
            });
            this.logger.log(`Created new picked quantity record for worker ${workerId}, inventory ${inventoryId}: ${totalPickedQuantity}`);
          }

          updatedRecords.push({
            ...workerInventory,
            productName: inventory.product.productName
          });
        }

        return updatedRecords;
      });

      this.logger.log(`Worker ${workerId} successfully updated picked quantities for ${results.length} products`);
      return results;

    } catch (error) {
      this.logger.error(`Error updating picked quantities for worker ${workerId}:`, error.message);
      throw error;
    }
  }

  /**
   * Evening: Worker updates remaining quantities for multiple products
   */
  async updateRemainingQuantities(remainingDto: UpdateRemainingDto) {
    const { workerId, remainingItems } = remainingDto;
    const today = this.getStartOfDay();

    if (!remainingItems || remainingItems.length === 0) {
      throw new BadRequestException('Remaining items array is required and cannot be empty');
    }

    try {
      // Verify worker exists and is active
      const worker = await this.prisma.worker.findFirst({
        where: { workerId, isActive: true },
        select: { workerId: true, firstName: true, lastName: true }
      });

      if (!worker) {
        throw new NotFoundException('Worker not found or inactive');
      }

      // Process all remaining items in a transaction
      const results = await this.prisma.$transaction(async (prisma) => {
        const updatedRecords = [];

        for (const item of remainingItems) {
          const { inventoryId, remainingQuantity } = item;

          if (remainingQuantity < 0) {
            throw new BadRequestException(`Remaining quantity cannot be negative for inventory ${inventoryId}`);
          }

          // Find existing worker inventory record for today
          const existingWorkerInventory = await prisma.workerInventory.findFirst({
            where: {
              workerId,
              inventoryId,
              date: {
                gte: today,
                lt: this.getEndOfDay(today)
              }
            },
            include: {
              worker: true
            }
          });

          if (!existingWorkerInventory) {
            // Get product name for better error message
            const inventory = await prisma.inventory.findUnique({
              where: { inventoryId },
              include: { product: { select: { productName: true } } }
            });
            
            throw new NotFoundException(
              `No picked quantity record found for worker ${workerId} and product "${inventory?.product?.productName || `inventory ${inventoryId}`}" today. Please update picked quantity first.`
            );
          }

          // Validate remaining quantity doesn't exceed picked quantity
          if (existingWorkerInventory.totalPickedQuantity && remainingQuantity > existingWorkerInventory.totalPickedQuantity) {
            throw new BadRequestException(
              `Remaining quantity (${remainingQuantity}) cannot be greater than picked quantity (${existingWorkerInventory.totalPickedQuantity}) for inventory ${inventoryId}`
            );
          }

          // Update the existing record with remaining quantity
          const workerInventory = await prisma.workerInventory.update({
            where: { id: existingWorkerInventory.id },
            data: {
              remainingQuantity,
              date: new Date() // Update timestamp to current time
            }
          });

          updatedRecords.push(workerInventory);
          this.logger.log(`Updated remaining quantity for worker ${workerId}, inventory ${inventoryId}: ${remainingQuantity}`);
        }

        return updatedRecords;
      });

      this.logger.log(`Worker ${workerId} successfully updated remaining quantities for ${results.length} products`);
      return results;

    } catch (error) {
      this.logger.error(`Error updating remaining quantities for worker ${workerId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get worker's daily activity for a specific date
   */
  async getWorkerDailyActivity(workerId: number, date?: Date): Promise<WorkerInventoryActivity[]> {
    const targetDate = date || new Date();
    const startOfDay = this.getStartOfDay(targetDate);

    try {
      const activities = await this.prisma.workerInventory.findMany({
        where: {
          workerId,
          date: {
            gte: startOfDay,
            lt: this.getEndOfDay(startOfDay)
          }
        },
        include: {
          worker: {
            select: {
              workerId: true,
              firstName: true,
              lastName: true,
              phoneNumber: true
            }
          }
        },
        orderBy: { date: 'desc' }
      });

      // Get inventory details for each activity
      const activitiesWithDetails = await Promise.all(
        activities.map(async (activity) => {
          const inventory = await this.prisma.inventory.findUnique({
            where: { inventoryId: activity.inventoryId },
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
            }
          });

          return {
            ...activity,
            inventory: inventory ? {
              inventoryId: inventory.inventoryId,
              totalOrderedQuantity: inventory.totalOrderedQuantity,
              receivedQuantity: inventory.receivedQuantity,
              product: {
                productId: inventory.product.productId,
                productName: inventory.product.productName,
                currentProductPrice: Number(inventory.product.currentProductPrice), // ✅ Convert Decimal to number
                storeId: inventory.product.storeId as string, // ✅ Cast enum to string
                imageUrl: inventory.product.imageUrl
              }
            } : null
          } as WorkerInventoryActivity;
        })
      );

      this.logger.log(`Retrieved ${activitiesWithDetails.length} activities for worker ${workerId} on ${startOfDay.toDateString()}`);
      return activitiesWithDetails;

    } catch (error) {
      this.logger.error(`Error fetching daily activity for worker ${workerId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get available inventories for worker to pick (today's inventories with received quantities)
   */
  

  /**
   * Get summary statistics for worker's daily activity
   */
  async getWorkerDailySummary(workerId: number, date?: Date) {
    const targetDate = date || new Date();
    const startOfDay = this.getStartOfDay(targetDate);

    try {
      const activities = await this.prisma.workerInventory.findMany({
        where: {
          workerId,
          date: {
            gte: startOfDay,
            lt: this.getEndOfDay(startOfDay)
          }
        }
      });

      const summary = {
        date: startOfDay.toDateString(),
        totalProducts: activities.length,
        totalPickedQuantity: activities.reduce((sum, activity) => sum + (activity.totalPickedQuantity || 0), 0),
        totalRemainingQuantity: activities.reduce((sum, activity) => sum + (activity.remainingQuantity || 0), 0),
        completedProducts: activities.filter(activity => activity.remainingQuantity !== null).length,
        pendingProducts: activities.filter(activity => activity.remainingQuantity === null).length,
        distributedQuantity: activities.reduce((sum, activity) => {
          const picked = activity.totalPickedQuantity || 0;
          const remaining = activity.remainingQuantity || 0;
          return sum + Math.max(0, picked - remaining);
        }, 0),
        efficiency: activities.length > 0 ? 
          Math.round((activities.filter(activity => activity.remainingQuantity !== null).length / activities.length) * 100) : 0
      };

      this.logger.log(`Generated daily summary for worker ${workerId}: ${summary.totalProducts} products, ${summary.efficiency}% complete`);
      return summary;

    } catch (error) {
      this.logger.error(`Error calculating daily summary for worker ${workerId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get worker's activity history for multiple dates
   */
  async getWorkerActivityHistory(workerId: number, days: number = 7) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      const activities = await this.prisma.workerInventory.findMany({
        where: {
          workerId,
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          worker: {
            select: {
              workerId: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { date: 'desc' }
      });

      // Group by date
      const activityByDate = activities.reduce((acc, activity) => {
        const dateKey = this.getStartOfDay(activity.date).toDateString();
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(activity);
        return acc;
      }, {} as Record<string, any[]>);

      this.logger.log(`Retrieved ${days} days of activity history for worker ${workerId}`);
      return activityByDate;

    } catch (error) {
      this.logger.error(`Error fetching activity history for worker ${workerId}:`, error.message);
      throw error;
    }
  }
}
