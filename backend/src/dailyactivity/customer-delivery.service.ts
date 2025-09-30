// customer-delivery.service.ts
import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ProcessDeliveryDto } from './dto/process-delivery.dto'

@Injectable()
export class CustomerDeliveryService {
  constructor(private prisma: PrismaService) {}

  // Process single delivery
async processDelivery(dto: ProcessDeliveryDto, userLogin: string, userRole: string) {
  if (userRole !== 'WORKER' && userRole !== 'ADMIN') {
    throw new ForbiddenException('Only workers can process deliveries')
  }

  const { customerId, inventoryId, deliveredQuantity, billAmount, isPriceCustomized  } = dto
  const today = new Date()
  
  // Set time to start of day for date comparison
  const todayStartOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  // Validation
  if (deliveredQuantity <= 0) {
    throw new BadRequestException('Quantity must be greater than 0')
  }
  if (billAmount <= 0) {
    throw new BadRequestException('Bill amount must be greater than 0')
  }

  try {
    const result = await this.prisma.$transaction(async (prisma) => {
      // 1. Check if same customer-inventory-date combination already exists
      const existingDelivery = await prisma.customerInventory.findFirst({
        where: {
          customerId,
          inventoryId,
          date: {
            gte: todayStartOfDay,
            lt: new Date(todayStartOfDay.getTime() + 24 * 60 * 60 * 1000) // Next day
          }
        }
      })

      // If exact combination exists, skip creating new entries
      if (existingDelivery) {
        console.log(`Duplicate delivery attempt blocked: Customer ${customerId}, Inventory ${inventoryId}, Date ${todayStartOfDay.toDateString()}`)
        
        return {
          success: true,
          message: 'Delivery already processed for this customer-product combination today',
          isDuplicate: true,
          skipped: true
        }
      }

      // 2. Get customer details (only if no duplicate)
      const customer = await prisma.customer.findUnique({
        where: { customerId },
        select: {
          customerId: true,
          firstName: true,
          lastName: true,
          classification: true,
        }
      })

      if (!customer) {
        throw new NotFoundException(`Customer with ID ${customerId} not found`)
      }

      // 3. Get inventory/product details
      const inventory = await prisma.inventory.findUnique({
        where: { inventoryId },
        include: {
          product: {
            select: { productName: true }
          }
        }
      })

      if (!inventory) {
        throw new NotFoundException(`Inventory with ID ${inventoryId} not found`)
      }

      // 4. ✅ SIMPLIFIED: Payment collection logic
      // If price customized = collected (true)
      // If price not customized = not collected (false)
      const isPaymentCollected = isPriceCustomized

      // 5. ✅ ALWAYS Create CustomerInventory record (in all cases)
      const customerInventory = await prisma.customerInventory.create({
        data: {
          customerId,
          inventoryId,
          date: today,
          deliveredQuantity,
          userLogin,
        }
      })

      // 6. ✅ ALWAYS Create PaymentReceived record with billAmount (in all cases)
      const payment = await prisma.paymentReceived.create({
        data: {
          customerId,
          inventoryId,
          bill: billAmount, // ✅ Always add billAmount
          isCollected: isPaymentCollected, // ✅ true if customized, false if not
          date: today,
        }
      })

      // 7. Return delivery confirmation
      return {
        deliveryId: customerInventory.id,
        paymentId: payment.id,
        customerName: `${customer.firstName} ${customer.lastName || ''}`.trim(),
        customerType: customer.classification,
        productName: inventory.product.productName,
        deliveredQuantity,
        billAmount,
        isPriceCustomized,
        collectionStatus: isPaymentCollected ? 'Collected' : 'Pending Collection',
        collectionReason: isPriceCustomized 
          ? 'Custom price - collected on spot' 
          : 'Standard price - pending collection',
        deliveryDate: today,
        isDuplicate: false,
        skipped: false
      }
    })

    return {
      success: true,
      message: result.skipped 
        ? 'Delivery already exists - no new entry created'
        : 'Delivery processed successfully',
      data: result.skipped ? null : result,
      isDuplicate: result.isDuplicate || false
    }

  } catch (error) {
    console.error('Error processing delivery:', error.message)
    throw error
  }
}



  // ADMIN ONLY: Get delivery summary
  async getDeliverySummary(date?: Date, userRole?: string) {
    if (userRole !== 'ADMIN') {
      throw new ForbiddenException('Only administrators can view delivery summaries')
    }

    const searchDate = date || new Date()
    const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0))
    const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999))

    // Get all deliveries for the day
    const deliveries = await this.prisma.customerInventory.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        }
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            classification: true,
          }
        }
      }
    })

    // Get all payments for the day
    const payments = await this.prisma.paymentReceived.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        }
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            classification: true,
          }
        }
      }
    })

    // Calculate summary
    const summary = {
      totalDeliveries: deliveries.length,
      totalBillAmount: payments.reduce((sum, payment) => sum + Number(payment.bill), 0),
      collectedAmount: payments
        .filter(payment => payment.isCollected)
        .reduce((sum, payment) => sum + Number(payment.bill), 0),
      pendingAmount: payments
        .filter(payment => !payment.isCollected)
        .reduce((sum, payment) => sum + Number(payment.bill), 0),
      b2bCustomers: payments.filter(p => p.customer.classification === 'B2B').length,
      b2cCustomers: payments.filter(p => p.customer.classification === 'B2C').length,
    }

    return {
      success: true,
      summary,
      deliveries,
      payments,
    }
  }

  // WORKER ONLY: Get my delivery confirmation
  async getMyDeliveries(userLogin: string, date?: Date) {
    const searchDate = date || new Date()
    const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0))
    const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999))

    const deliveries = await this.prisma.customerInventory.findMany({
      where: {
        userLogin,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        }
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            classification: true,
          }
        }
      }
    })

    // Get payment details for these deliveries
    const customerIds = deliveries.map(d => d.customerId)
    const payments = await this.prisma.paymentReceived.findMany({
      where: {
        customerId: { in: customerIds },
        date: {
          gte: startOfDay,
          lte: endOfDay,
        }
      }
    })

    // Combine delivery and payment data
    const deliveriesWithPayments = deliveries.map(delivery => {
      const payment = payments.find(p => 
        p.customerId === delivery.customerId && 
        p.inventoryId === delivery.inventoryId
      )
      
      return {
        deliveryId: delivery.id,
        customerName: `${delivery.customer.firstName} ${delivery.customer.lastName || ''}`.trim(),
        deliveredQuantity: delivery.deliveredQuantity,
        billAmount: payment?.bill || 0,
        collectionStatus: payment?.isCollected ? 'Collected' : 'Pending',
        deliveryDate: delivery.date,
      }
    })

    return {
      success: true,
      totalDeliveries: deliveries.length,
      totalAmount: payments.reduce((sum, p) => sum + Number(p.bill), 0),
      data: deliveriesWithPayments,
    }
  }
}
