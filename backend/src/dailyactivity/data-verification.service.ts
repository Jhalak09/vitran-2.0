import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DataVerificationService {
  private readonly logger = new Logger(DataVerificationService.name);

  constructor(private prisma: PrismaService) {}

  private createDateFromString(dateInput?: Date | string): Date {
    if (!dateInput) {
      const now = new Date();
      const todayString = now.getFullYear() + '-' + 
                         String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                         String(now.getDate()).padStart(2, '0');
      return new Date(todayString + 'T00:00:00.000Z');
    }
    
    if (typeof dateInput === 'string') {
      return new Date(dateInput + 'T00:00:00.000Z');
    }
    
    const dateStr = dateInput.getFullYear() + '-' + 
                    String(dateInput.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(dateInput.getDate()).padStart(2, '0');
    return new Date(dateStr + 'T00:00:00.000Z');
  }

  /**
   * Get simple worker cash summary - worker ID, name and cash collected
   */
  async getWorkerCashSummary(date?: Date) {
    const targetDate = this.createDateFromString(date);
    const endDate = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);

    this.logger.log(`Getting worker cash summary for ${targetDate.toDateString()}`);

    // Get cash in hand for all workers for the day
    const cashData = await this.prisma.cashInHand.findMany({
      where: {
        date: {
          gte: targetDate,
          lt: endDate
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
      }
    });

    // Return format with IDs included
    return cashData.map(cash => ({
      workerId: cash.worker.workerId,
      workerName: `${cash.worker.firstName} ${cash.worker.lastName}`,
      cashCollected: cash.amount
    }));
  }

  /**
   * Get full overview by joining all tables through inventoryId
   */
  async getDailyDeliveriesOverview(date?: Date) {
  const targetDate = this.createDateFromString(date);
  const endDate = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);

  this.logger.log(`Getting daily deliveries overview for ${targetDate.toDateString()}`);

  // Get all customer deliveries with inventory details
  const deliveries = await this.prisma.customerInventory.findMany({
    where: {
      date: {
        gte: targetDate,
        lt: endDate
      }
    },
    include: {
      customer: {
        select: {
          customerId: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });

  // Get payment information
  const payments = await this.prisma.paymentReceived.findMany({
    where: {
      date: {
        gte: targetDate,
        lt: endDate
      }
    },
    select: {
      inventoryId: true,
      bill: true,
      isCollected: true,
      customerId: true
    }
  });

  // Get worker inventory to know which worker handled which inventory
  const workerInventories = await this.prisma.workerInventory.findMany({
    where: {
      date: {
        gte: targetDate,
        lt: endDate
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
    }
  });

  // Get all unique inventory IDs
  const allInventoryIds = [
    ...deliveries.map(d => d.inventoryId),
    ...payments.map(p => p.inventoryId),
    ...workerInventories.map(w => w.inventoryId)
  ];

  // Get inventory details with product info
  const inventories = await this.prisma.inventory.findMany({
    where: {
      inventoryId: {
        in: allInventoryIds
      }
    },
    include: {
      product: {
        select: {
          productName: true
        }
      }
    }
  });

  // Create maps for quick lookup
  const inventoryMap = new Map(inventories.map(inv => [inv.inventoryId, inv]));
  const paymentMap = new Map(payments.map(p => [p.inventoryId, p]));
  const workerInventoryMap = new Map(workerInventories.map(w => [w.inventoryId, w]));

  // Process and combine all data with IDs included
  const overview = deliveries.map(delivery => {
    const inventory = inventoryMap.get(delivery.inventoryId);
    const payment = paymentMap.get(delivery.inventoryId);
    const workerInventory = workerInventoryMap.get(delivery.inventoryId);

    return {
      workerId: workerInventory?.worker.workerId || null,
      workerName: workerInventory ? 
        `${workerInventory.worker.firstName} ${workerInventory.worker.lastName}` : 
        'Unknown',
      customerId: delivery.customer.customerId,
      customerName: `${delivery.customer.firstName} ${delivery.customer.lastName || ''}`.trim(),
      inventoryId: delivery.inventoryId,
      productName: inventory?.product?.productName || 'Unknown Product',
      deliveredQuantity: delivery.deliveredQuantity,
      bill: payment ? Number(payment.bill) : 0,
      isCollected: payment ? payment.isCollected : false,
      verificationId: delivery.verificationId || null
    };
  });

  return overview;
}

}
