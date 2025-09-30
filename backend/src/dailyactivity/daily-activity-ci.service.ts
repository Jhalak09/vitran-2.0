import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface WorkerCustomerDetails {
  id: number;
  workerId: number;
  customerId: number | null;
  fromDate: Date;
  thruDate: Date | null;
  customer: {
    customerId: number;
    firstName: string;
    lastName: string | null;
    address1: string;
    address2: string | null;
    phoneNumber: string | null;
    city: string | null;
    pincode: string | null;
    classification: string;
  } | null;
}

export interface WorkerInventoryDetails {
  id: number;
  workerId: number;
  inventoryId: number;
  totalPickedQuantity: number | null;
  remainingQuantity: number | null;
  date: Date;
  inventory: {
    inventoryId: number;
    totalOrderedQuantity: number;
    receivedQuantity: number | null;
    remainingQuantity: number | null;
    date: Date;
    product: {
      productId: number;
      productName: string;
      currentProductPrice: number;
      storeId: string;
      imageUrl: string | null;
      description: string | null;
    };
  } | null;
}

export interface DeliveryDto {
  workerId: number;
  customerId: number;
  deliveries: Array<{
    productId: number;
    quantity: number;
    price: number;
  }>;
}

@Injectable()
export class DailyActivityCiService {
  private readonly logger = new Logger(DailyActivityCiService.name);

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
   * Function 1: Get worker-wise customer details
   * Fetches all customers assigned to a specific worker
   */
  async getWorkerCustomers(workerId: number) {
  return this.prisma.workerCustomer.findMany({
    where: {
      workerId,
      OR: [
        { thruDate: null },
        { thruDate: { gt: new Date() } }
      ]
    },
    include: {
      customer: {
        select: {
          customerId: true,
          firstName: true,
          lastName: true,
          address1: true,
          address2: true,
          phoneNumber: true,
          city: true,
          pincode: true,
          classification: true
        }
      }
    },
    orderBy: {
      fromDate: 'desc'
    }
  });
}

  /**
   * Function 2: Get worker's inventory details with product information
   * Fetches worker inventory including inventory and product details using inventory ID
   */
  async getWorkerInventoryWithProducts(workerId: number, date?: Date): Promise<WorkerInventoryDetails[]> {
    const targetDate = date || new Date();
    const startOfDay = this.getStartOfDay(targetDate);

    try {
      // Verify worker exists
      const worker = await this.prisma.worker.findFirst({
        where: { workerId, isActive: true },
        select: { workerId: true, firstName: true, lastName: true }
      });

      if (!worker) {
        throw new NotFoundException('Worker not found or inactive');
      }

      // Get worker's inventory records for the specified date
      const workerInventories = await this.prisma.workerInventory.findMany({
        where: {
          workerId,
          date: {
            gte: startOfDay,
            lt: this.getEndOfDay(startOfDay)
          }
        },
        orderBy: { date: 'desc' }
      });

      // Fetch inventory and product details for each worker inventory record
      const inventoriesWithDetails = await Promise.all(
        workerInventories.map(async (workerInventory) => {
          const inventory = await this.prisma.inventory.findUnique({
            where: { inventoryId: workerInventory.inventoryId },
            include: {
              product: {
                select: {
                  productId: true,
                  productName: true,
                  currentProductPrice: true,
                  storeId: true,
                  imageUrl: true,
                  description: true
                }
              }
            }
          });

          return {
            id: workerInventory.id,
            workerId: workerInventory.workerId,
            inventoryId: workerInventory.inventoryId,
            totalPickedQuantity: workerInventory.totalPickedQuantity,
            remainingQuantity: workerInventory.remainingQuantity,
            date: workerInventory.date,
            inventory: inventory ? {
              inventoryId: inventory.inventoryId,
              receivedQuantity: inventory.receivedQuantity,
              remainingQuantity: inventory.remainingQuantity,
              date: inventory.date,
              product: {
                productId: inventory.product.productId,
                productName: inventory.product.productName,
                currentProductPrice: Number(inventory.product.currentProductPrice), // Convert Decimal to number
                storeId: inventory.product.storeId as string, // Convert enum to string
                imageUrl: inventory.product.imageUrl,
                description: inventory.product.description
              }
            } : null
          } as WorkerInventoryDetails;
        })
      );

      // Filter out records where inventory couldn't be found
      const validInventories = inventoriesWithDetails.filter(item => item.inventory !== null);

      this.logger.log(`Retrieved ${validInventories.length} inventory records with product details for worker ${workerId} on ${startOfDay.toDateString()}`);
      return validInventories;

    } catch (error) {
      this.logger.error(`Error fetching inventory with products for worker ${workerId}:`, error.message);
      throw error;
    }
  }

  /**
   * Additional helper: Get inventory summary for worker
   */
  async getWorkerInventorySummary(workerId: number, date?: Date) {
    try {
      const inventoryDetails = await this.getWorkerInventoryWithProducts(workerId, date);
      
      const summary = {
        totalProducts: inventoryDetails.length,
        totalPickedQuantity: inventoryDetails.reduce((sum, item) => sum + (item.totalPickedQuantity || 0), 0),
        totalRemainingQuantity: inventoryDetails.reduce((sum, item) => sum + (item.remainingQuantity || 0), 0),
        completedProducts: inventoryDetails.filter(item => item.remainingQuantity !== null).length,
        pendingProducts: inventoryDetails.filter(item => item.remainingQuantity === null).length,
        totalValue: inventoryDetails.reduce((sum, item) => {
          if (item.inventory && item.totalPickedQuantity) {
            return sum + (item.totalPickedQuantity * item.inventory.product.currentProductPrice);
          }
          return sum;
        }, 0)
      };

      return summary;
    } catch (error) {
      this.logger.error(`Error calculating inventory summary for worker ${workerId}:`, error.message);
      throw error;
    }
  }
}
