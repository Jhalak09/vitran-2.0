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
   * ✅ FIXED: Get full overview using unique triplet mapping (customerId + workerId + inventoryId)
   */
  async getDailyDeliveriesOverview(date?: Date) {
    const targetDate = this.createDateFromString(date);
    const endDate = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);
    this.logger.log(`Getting daily deliveries overview for ${targetDate.toDateString()}`);

    // ✅ UPDATED: Get all customer deliveries with workerId included
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

    // ✅ UPDATED: Get payment information with workerId included
    const payments = await this.prisma.paymentReceived.findMany({
      where: {
        date: {
          gte: targetDate,
          lt: endDate
        }
      },
      select: {
        inventoryId: true,
        customerId: true,
        workerId: true,     // ✅ NOW INCLUDED
        bill: true,
        isCollected: true
      }
    });

    // ✅ SIMPLIFIED: Get worker information directly from deliveries
    const workerIds = [...new Set(deliveries.map(d => d.workerId).filter(Boolean))];
    const workers = await this.prisma.worker.findMany({
      where: {
        workerId: {
          in: workerIds
        }
      },
      select: {
        workerId: true,
        firstName: true,
        lastName: true
      }
    });

    // Get inventory details with product info
    const allInventoryIds = [
      ...deliveries.map(d => d.inventoryId),
      ...payments.map(p => p.inventoryId)
    ];

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

    // ✅ UPDATED: Create maps using unique triplet keys
    const inventoryMap = new Map(inventories.map(inv => [inv.inventoryId, inv]));
    const workerMap = new Map(workers.map(w => [w.workerId, w]));
    
    // ✅ CRITICAL FIX: Create payment map using triplet key (customerId-workerId-inventoryId)
    const paymentMap = new Map(payments.map(p => [
      `${p.customerId}-${p.workerId}-${p.inventoryId}`, 
      p
    ]));

    // ✅ UPDATED: Process and combine data using correct mapping
    const overview = deliveries.map(delivery => {
      const inventory = inventoryMap.get(delivery.inventoryId);
      const worker = workerMap.get(delivery.workerId);
      
      // ✅ CRITICAL FIX: Use triplet key to find correct payment
      const paymentKey = `${delivery.customerId}-${delivery.workerId}-${delivery.inventoryId}`;
      const payment = paymentMap.get(paymentKey);

      return {
        workerId: delivery.workerId || null,
        workerName: worker ? 
          `${worker.firstName} ${worker.lastName}` : 
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
