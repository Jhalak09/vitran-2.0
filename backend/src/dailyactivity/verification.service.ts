import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(private prisma: PrismaService) {}

  private createDateFromString(dateInput?: Date): Date {
    if (!dateInput) {
      const now = new Date();
      const todayString = now.getFullYear() + '-' + 
                         String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                         String(now.getDate()).padStart(2, '0');
      return new Date(todayString + 'T00:00:00.000Z');
    }
    
    const dateStr = dateInput.getFullYear() + '-' + 
                    String(dateInput.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(dateInput.getDate()).padStart(2, '0');
    return new Date(dateStr + 'T00:00:00.000Z');
  }

  async submitVerification(data: {
    deliveries: Array<{
      workerId: number;
      customerId: number;
      inventoryId: number;
      productName: string;
      deliveredQuantity: number;
      bill: number;
      isCollected: boolean;
    }>;
    cashData: Array<{
      workerId: number;
      actualAmount: number;
    }>;
    verifiedBy: string;
  }) {
    
    return this.prisma.$transaction(async (prisma) => {
      const today = this.createDateFromString();
      const startOfDay = new Date(today);
      const endOfDay = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1);

      // 1. Get or generate a daily verification ID
      let dailyVerificationId: number;
      
      // Check if any verification exists for today
      const existingVerification = await prisma.verifiedDelivery.findFirst({
        where: {
          verifiedAt: {
            gte: startOfDay,
            lt: endOfDay
          }
        },
        select: { verificationId: true },
        orderBy: { verificationId: 'asc' }
      });

      if (existingVerification) {
        dailyVerificationId = existingVerification.verificationId;
        this.logger.log(`Using existing daily verification ID: ${dailyVerificationId}`);
      } else {
        // Generate new verification ID (you can use timestamp or any logic)
        dailyVerificationId = parseInt(Date.now().toString().slice(-8)); // Last 8 digits of timestamp
        this.logger.log(`Generated new daily verification ID: ${dailyVerificationId}`);
      }

      // 2. Process all deliveries with the SAME verification ID
      let processedDeliveries = 0;
      let updatedDeliveries = 0;

      for (const delivery of data.deliveries) {
        try {
          // Use upsert to handle create/update logic
          await prisma.verifiedDelivery.upsert({
            where: {
              verificationId_workerId_customerId_inventoryId: {
                verificationId: dailyVerificationId,
                workerId: delivery.workerId,
                customerId: delivery.customerId,
                inventoryId: delivery.inventoryId
              }
            },
            update: {
              // Update the existing record
              productName: delivery.productName,
              deliveredQuantity: delivery.deliveredQuantity,
              bill: delivery.bill,
              isCollected: delivery.isCollected,
              verifiedBy: data.verifiedBy,
              verifiedAt: new Date()
            },
            create: {
              // Create new record with the SAME verification ID
              verificationId: dailyVerificationId,
              workerId: delivery.workerId,
              customerId: delivery.customerId,
              inventoryId: delivery.inventoryId,
              productName: delivery.productName,
              deliveredQuantity: delivery.deliveredQuantity,
              bill: delivery.bill,
              isCollected: delivery.isCollected,
              verifiedBy: data.verifiedBy,
              verifiedAt: new Date()
            }
          });

          processedDeliveries++;
          this.logger.log(`Processed delivery for worker ${delivery.workerId}, customer ${delivery.customerId}, inventory ${delivery.inventoryId} with verification ID ${dailyVerificationId}`);

        } catch (error) {
          this.logger.error(`Failed to process delivery: ${error.message}`);
        }
      }

      // 3. Update ALL CustomerInventory records with the SAME verification ID
      const inventoryIds = [...new Set(data.deliveries.map(d => d.inventoryId))];
      
      const customerInventoryUpdate = await prisma.customerInventory.updateMany({
        where: {
          inventoryId: {
            in: inventoryIds
          },
          date: {
            gte: startOfDay,
            lt: endOfDay
          }
        },
        data: {
          verificationId: dailyVerificationId // Same ID for ALL
        }
      });

      this.logger.log(`Updated ${customerInventoryUpdate.count} CustomerInventory records with verification ID ${dailyVerificationId}`);

      // 4. Update CashInHand with actual amounts
      let updatedCashRecords = 0;
      for (const cash of data.cashData) {
        const result = await prisma.cashInHand.updateMany({
          where: {
            workerId: cash.workerId,
            date: {
              gte: startOfDay,
              lt: endOfDay
            }
          },
          data: {
            actualAmount: cash.actualAmount
          }
        });
        updatedCashRecords += result.count;
      }

      return {
        dailyVerificationId,
        processedDeliveries,
        updatedCustomerInventoryRecords: customerInventoryUpdate.count,
        updatedCashRecords,
        message: `Verification completed with single ID ${dailyVerificationId} for all ${processedDeliveries} deliveries and ${customerInventoryUpdate.count} inventory records.`
      };
    });
  }
}
