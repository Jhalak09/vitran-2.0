import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class BillService {
  private readonly logger = new Logger(BillService.name);

  constructor(private prisma: PrismaService) {}

  private createDateFromString(dateString: string): Date {
    return new Date(dateString + 'T00:00:00.000Z');
  }

  async generateBill(data: {
    customerId: number;
    startDate: string;
    endDate: string;
    includeDeliveryCharges: boolean;
    createdBy: string;
  }) {
    const startDate = this.createDateFromString(data.startDate);
    const endDate = new Date(this.createDateFromString(data.endDate).getTime() + 24 * 60 * 60 * 1000 - 1);

    return this.prisma.$transaction(async (prisma) => {
      // 1. Get unbilled verified deliveries for the customer in date range
      const unbilledDeliveries = await prisma.verifiedDelivery.findMany({
        where: {
          customerId: data.customerId,
          isCollected: false,
          billed: false,
          verifiedAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: [
          { verifiedAt: 'asc' },
          { productName: 'asc' }
        ]
      });

      if (unbilledDeliveries.length === 0) {
        throw new Error('No unbilled deliveries found for the selected period');
      }

      // 2. Calculate totals
      const totalAmount = unbilledDeliveries.reduce((sum, delivery) => 
        sum + Number(delivery.bill), 0
      );

      let deliveryCharges = 0;
      if (data.includeDeliveryCharges) {
        const deliveryChargeRecord = await prisma.deliverycharge.findFirst();
        deliveryCharges = deliveryChargeRecord?.charge || 0;
      }

      const grandTotal = totalAmount + deliveryCharges;

      // 3. Generate bill number
      const billCount = await prisma.bill.count();
      const billNumber = `BILL-${new Date().getFullYear()}-${(billCount + 1).toString().padStart(4, '0')}`;

      // 4. Create bill record
      const bill = await prisma.bill.create({
        data: {
          billNumber,
          customerId: data.customerId,
          startDate,
          endDate,
          totalAmount: grandTotal,
          deliveryCharges: data.includeDeliveryCharges ? deliveryCharges : null,
          createdBy: data.createdBy
        },
        include: {
          customer: true
        }
      });

      // 5. Mark all related deliveries as billed
      await prisma.verifiedDelivery.updateMany({
        where: {
          customerId: data.customerId,
          isCollected: false,
          billed: false,
          verifiedAt: {
            gte: startDate,
            lte: endDate
          }
        },
        data: {
          billed: true
        }
      });

      return {
        bill,
        deliveriesCount: unbilledDeliveries.length,
        totalAmount,
        deliveryCharges,
        grandTotal
      };
    });
  }

  async generateBillPDF(billId: number): Promise<Buffer> {
    const bill = await this.prisma.bill.findUnique({
      where: { billId },
      include: {
        customer: true
      }
    });

    if (!bill) {
      throw new Error('Bill not found');
    }

    // Get all verified deliveries for this bill
    const deliveries = await this.prisma.verifiedDelivery.findMany({
      where: {
        customerId: bill.customerId,
        billed: true,
        verifiedAt: {
          gte: bill.startDate,
          lte: bill.endDate
        }
      },
      orderBy: [
        { verifiedAt: 'asc' },
        { productName: 'asc' }
      ]
    });

    // Group deliveries by product
    const productSummary = deliveries.reduce((acc, delivery) => {
      const key = delivery.productName;
      if (!acc[key]) {
        acc[key] = {
          productName: key,
          totalQuantity: 0,
          unitPrice: Number(delivery.bill) / delivery.deliveredQuantity,
          totalAmount: 0
        };
      }
      acc[key].totalQuantity += delivery.deliveredQuantity;
      acc[key].totalAmount += Number(delivery.bill);
      return acc;
    }, {});

    const productItems = Object.values(productSummary);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          resolve(Buffer.concat(buffers));
        });

        // Company Header
        doc.fontSize(20).font('Helvetica-Bold').text('VITRAN MILK DELIVERY', 50, 50);
        doc.fontSize(12).font('Helvetica').text('Address: Your Company Address', 50, 80);
        doc.text('Phone: Your Phone Number', 50, 95);
        doc.text('Email: your@email.com', 50, 110);

        // Bill Details
        doc.fontSize(16).font('Helvetica-Bold').text(`BILL: ${bill.billNumber}`, 400, 50);
        doc.fontSize(12).font('Helvetica').text(`Date: ${bill.createdAt.toLocaleDateString()}`, 400, 80);

        // Customer Details
        doc.fontSize(14).font('Helvetica-Bold').text('BILL TO:', 50, 150);
        doc.fontSize(12).font('Helvetica');
        doc.text(`${bill.customer.firstName} ${bill.customer.lastName || ''}`, 50, 170);
        doc.text(`${bill.customer.address1}`, 50, 185);
        if (bill.customer.address2) doc.text(`${bill.customer.address2}`, 50, 200);
        doc.text(`${bill.customer.city || ''} ${bill.customer.pincode || ''}`, 50, 215);
        if (bill.customer.phoneNumber) doc.text(`Phone: ${bill.customer.phoneNumber}`, 50, 230);

        // Bill Period
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text(`Billing Period: ${bill.startDate.toLocaleDateString()} to ${bill.endDate.toLocaleDateString()}`, 50, 260);

        // Product Summary Table
        doc.fontSize(14).font('Helvetica-Bold').text('PRODUCT SUMMARY', 50, 290);
        
        const tableTop = 320;
        const tableHeaders = ['Product Name', 'Quantity', 'Unit Price', 'Amount'];
        const colWidths = [200, 80, 100, 100];
        let currentX = 50;

        // Table headers
        doc.fontSize(10).font('Helvetica-Bold');
        tableHeaders.forEach((header, i) => {
          doc.text(header, currentX, tableTop, { width: colWidths[i] });
          currentX += colWidths[i];
        });

        // Table rows
        let currentY = tableTop + 20;
        doc.font('Helvetica').fontSize(9);
        
        productItems.forEach((item: any) => {
          currentX = 50;
          doc.text(item.productName, currentX, currentY, { width: colWidths[0] });
          currentX += colWidths[0];
          doc.text(item.totalQuantity.toString(), currentX, currentY, { width: colWidths[1] });
          currentX += colWidths[1];
          doc.text(`₹${item.unitPrice.toFixed(2)}`, currentX, currentY, { width: colWidths[2] });
          currentX += colWidths[2];
          doc.text(`₹${item.totalAmount.toFixed(2)}`, currentX, currentY, { width: colWidths[3] });
          currentY += 15;
        });

        // Totals
        currentY += 10;
        const subtotal = Number(bill.totalAmount) - (Number(bill.deliveryCharges) || 0);
        
        doc.fontSize(10).font('Helvetica');
        doc.text(`Subtotal: ₹${subtotal.toFixed(2)}`, 400, currentY);
        currentY += 15;
        
        if (bill.deliveryCharges) {
          doc.text(`Delivery Charges: ₹${Number(bill.deliveryCharges).toFixed(2)}`, 400, currentY);
          currentY += 15;
        }
        
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text(`TOTAL: ₹${Number(bill.totalAmount).toFixed(2)}`, 400, currentY);

        // New page for delivery details
        doc.addPage();
        
        doc.fontSize(14).font('Helvetica-Bold').text('DELIVERY DETAILS', 50, 50);
        
        const detailHeaders = ['Date', 'Product', 'Quantity', 'Amount'];
        const detailColWidths = [80, 200, 80, 100];
        
        currentY = 80;
        currentX = 50;
        
        // Headers
        doc.fontSize(10).font('Helvetica-Bold');
        detailHeaders.forEach((header, i) => {
          doc.text(header, currentX, currentY, { width: detailColWidths[i] });
          currentX += detailColWidths[i];
        });

        // Delivery rows
        currentY += 20;
        doc.font('Helvetica').fontSize(9);
        
        deliveries.forEach(delivery => {
          currentX = 50;
          doc.text(delivery.verifiedAt.toLocaleDateString(), currentX, currentY, { width: detailColWidths[0] });
          currentX += detailColWidths[0];
          doc.text(delivery.productName, currentX, currentY, { width: detailColWidths[1] });
          currentX += detailColWidths[1];
          doc.text(delivery.deliveredQuantity.toString(), currentX, currentY, { width: detailColWidths[2] });
          currentX += detailColWidths[2];
          doc.text(`₹${Number(delivery.bill).toFixed(2)}`, currentX, currentY, { width: detailColWidths[3] });
          currentY += 15;
        });

        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }

  async getCustomerBills(customerId: number) {
    return this.prisma.bill.findMany({
      where: { customerId },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async markBillAsPaid(billId: number) {
    return this.prisma.$transaction(async (prisma) => {
      // 1. Update bill as paid
      const bill = await prisma.bill.update({
        where: { billId },
        data: {
          isPaid: true,
          paidAt: new Date()
        }
      });

      // 2. Mark all related verified deliveries as collected
      await prisma.verifiedDelivery.updateMany({
        where: {
          customerId: bill.customerId,
          billed: true,
          verifiedAt: {
            gte: bill.startDate,
            lte: bill.endDate
          }
        },
        data: {
          isCollected: true
        }
      });

      return bill;
    });
  }

  async previewBill(data: {
    customerId: number;
    startDate: string;
    endDate: string;
    includeDeliveryCharges: boolean;
  }) {
    const startDate = this.createDateFromString(data.startDate);
    const endDate = new Date(this.createDateFromString(data.endDate).getTime() + 24 * 60 * 60 * 1000 - 1);

    // Get unbilled verified deliveries
    const unbilledDeliveries = await this.prisma.verifiedDelivery.findMany({
      where: {
        customerId: data.customerId,
        isCollected: false,
        billed: false,
        verifiedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: [
        { verifiedAt: 'asc' },
        { productName: 'asc' }
      ]
    });

    // Get customer details
    const customer = await this.prisma.customer.findUnique({
      where: { customerId: data.customerId }
    });

    // Group by product
    const productSummary = unbilledDeliveries.reduce((acc, delivery) => {
      const key = delivery.productName;
      if (!acc[key]) {
        acc[key] = {
          productName: key,
          totalQuantity: 0,
          unitPrice: Number(delivery.bill) / delivery.deliveredQuantity,
          totalAmount: 0
        };
      }
      acc[key].totalQuantity += delivery.deliveredQuantity;
      acc[key].totalAmount += Number(delivery.bill);
      return acc;
    }, {});

    const totalAmount = unbilledDeliveries.reduce((sum, delivery) => 
      sum + Number(delivery.bill), 0
    );

    let deliveryCharges = 0;
    if (data.includeDeliveryCharges) {
      const deliveryChargeRecord = await this.prisma.deliverycharge.findFirst();
      deliveryCharges = deliveryChargeRecord?.charge || 0;
    }

    return {
      customer,
      deliveries: unbilledDeliveries,
      productSummary: Object.values(productSummary),
      totalAmount,
      deliveryCharges,
      grandTotal: totalAmount + deliveryCharges,
      startDate,
      endDate
    };
  }
}
