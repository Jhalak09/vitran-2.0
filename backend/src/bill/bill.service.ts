import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { BillPDFGenerator, BillPDFData } from './bill-pdf.helper';

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
      try {
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
        console.log('Generated dates:', {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    customerId: data.customerId
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
        console.log('Generated bill number:', billNumber);
        console.log('Total Amount:', totalAmount, 'Delivery Charges:', deliveryCharges, 'Grand Total:', grandTotal);
        // 4. Create bill record with file path
        const bill = await prisma.bill.create({
          data: {
            billNumber,
            customerId: data.customerId,
            startDate,
            endDate,
            totalAmount: grandTotal,
            deliveryCharges: data.includeDeliveryCharges ? deliveryCharges : null,
            createdBy: data.createdBy,
            filePath: null, // Will be updated after PDF generation
            fileName: null
          },
          include: {
            customer: true
          }
        });

        console.log('Created bill record:', bill);

        // 5. Generate and save PDF
        // 5. Generate PDF - WRAP IN TRY-CATCH
        let pdfBuffer;
        try {
          console.log('🔄 Starting PDF generation...');
        pdfBuffer = await this.generateBillPDFWithData(bill, unbilledDeliveries);
          console.log('✅ PDF generated successfully');
        } catch (pdfError) {
          console.error('❌ PDF generation failed:', pdfError.message);
          throw new Error(`PDF generation failed: ${pdfError.message}`);
        }

        // 6. Save PDF - WRAP IN TRY-CATCH
        let filePath, fileName;
        try {
          console.log('🔄 Saving PDF...');
          const result = await this.saveBillPDF(bill, pdfBuffer);
          filePath = result.filePath;
          fileName = result.fileName;
          console.log('✅ PDF saved successfully:', fileName);
        } catch (saveError) {
          console.error('❌ PDF saving failed:', saveError.message);
          throw new Error(`PDF saving failed: ${saveError.message}`);
        }

         // 7. Update bill record
          console.log('🔄 Updating bill with file paths...');
          const updatedBill = await prisma.bill.update({
            where: { billId: bill.billId },
            data: { filePath, fileName },
            include: { customer: true }
          });

         // 8. Mark deliveries as billed
    console.log('🔄 Marking deliveries as billed...');
    await prisma.verifiedDelivery.updateMany({
      where: {
        customerId: data.customerId,
        isCollected: false,
        billed: false,
        verifiedAt: { gte: startDate, lte: endDate }
      },
      data: { billed: true }
    });

    console.log('🎉 Transaction completed successfully');
    return {
      bill: updatedBill,
      deliveriesCount: unbilledDeliveries.length,
      totalAmount,
      deliveryCharges,
      grandTotal,
      filePath,
      fileName
    };
     
      });
    } catch (transactionError) {
    console.error('❌ Transaction failed, rolling back:', transactionError);
    throw transactionError; // This will rollback the transaction
  }
    }

  private async saveBillPDF(bill: any, pdfBuffer: Buffer): Promise<{ filePath: string, fileName: string }> {
    // Create bills directory if it doesn't exist
    const billsDir = path.join(process.cwd(), 'uploads', 'bills');
    if (!fs.existsSync(billsDir)) {
      fs.mkdirSync(billsDir, { recursive: true });
    }

    // Create custom filename: CustomerName_Month_DateRange
    const startDate = new Date(bill.startDate);
    const endDate = new Date(bill.endDate);
    const customerName = `${bill.customer.firstName}_${bill.customer.lastName || ''}`.replace(/\s+/g, '_');
    const monthYear = startDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }).replace(' ', '_');
    const dateRange = `${startDate.getDate()}-${startDate.getMonth() + 1}-${startDate.getFullYear()}_to_${endDate.getDate()}-${endDate.getMonth() + 1}-${endDate.getFullYear()}`;
    
    const fileName = `${customerName}_${monthYear}_${dateRange}.pdf`;
    const filePath = path.join(billsDir, fileName);

    // Save PDF to file
    fs.writeFileSync(filePath, pdfBuffer);

    return {
      filePath: `uploads/bills/${fileName}`, // Relative path for serving
      fileName
    };
  }

  async generateBillPDF(billId: number): Promise<Buffer> {
  const bill = await this.prisma.bill.findUnique({
    where: { billId },
    include: {
      customer: true
    }
  });
  console.log('Generating PDF for bill:', bill);

  if (!bill) {
    throw new Error('Bill not found');
  }

  // Get all verified deliveries for this bill
  const deliveries = await this.prisma.verifiedDelivery.findMany({
    where: {
      customerId: bill.customerId,
      billed: false,
      isCollected: false,
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

  const productItems = Object.values(productSummary) as any[];

  // Prepare data for PDF helper - Convert Decimal types to numbers
  const pdfData: BillPDFData = {
    bill: {
      billId: bill.billId,
      billNumber: bill.billNumber,
      startDate: bill.startDate,
      endDate: bill.endDate,
      totalAmount: Number(bill.totalAmount), // Convert Decimal to number
      deliveryCharges: bill.deliveryCharges ? Number(bill.deliveryCharges) : undefined, // Convert Decimal to number
      customer: {
        firstName: bill.customer.firstName,
        lastName: bill.customer.lastName || undefined,
        address1: bill.customer.address1,
        address2: bill.customer.address2 || undefined,
        city: bill.customer.city || undefined,
        pincode: bill.customer.pincode || undefined,
        phoneNumber: bill.customer.phoneNumber || undefined
      }
    },
    deliveries: deliveries.map(delivery => ({
      verifiedAt: delivery.verifiedAt,
      productName: delivery.productName,
      deliveredQuantity: delivery.deliveredQuantity,
      bill: Number(delivery.bill) // Convert Decimal to number
    })),
    productSummary: productItems
  };

  // Generate PDF using helper
  return BillPDFGenerator.generatePDF(pdfData);
}

private async generateBillPDFWithData(bill: any, deliveries: any[]): Promise<Buffer> {
  console.log('Generating PDF with direct data for bill:', bill.billId);
  
  // Group deliveries by product (same logic as existing method)
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

  const productItems = Object.values(productSummary) as any[];

  // Prepare data for PDF helper
  const pdfData: BillPDFData = {
    bill: {
      billId: bill.billId,
      billNumber: bill.billNumber,
      startDate: bill.startDate,
      endDate: bill.endDate,
      totalAmount: Number(bill.totalAmount),
      deliveryCharges: bill.deliveryCharges ? Number(bill.deliveryCharges) : undefined,
      customer: {
        firstName: bill.customer.firstName,
        lastName: bill.customer.lastName || undefined,
        address1: bill.customer.address1,
        address2: bill.customer.address2 || undefined,
        city: bill.customer.city || undefined,
        pincode: bill.customer.pincode || undefined,
        phoneNumber: bill.customer.phoneNumber || undefined
      }
    },
    deliveries: deliveries.map(delivery => ({
      verifiedAt: delivery.verifiedAt,
      productName: delivery.productName,
      deliveredQuantity: delivery.deliveredQuantity,
      bill: Number(delivery.bill)
    })),
    productSummary: productItems
  };

  return BillPDFGenerator.generatePDF(pdfData);
}

  
  async getCustomerBills(customerId: number) {
    const bills = await this.prisma.bill.findMany({
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

    // Add file existence check
    return bills.map(bill => ({
      ...bill,
      fileExists: bill.filePath ? fs.existsSync(path.join(process.cwd(), bill.filePath)) : false
    }));
  }

  async downloadStoredBill(billId: number): Promise<{ buffer: Buffer, fileName: string }> {
    const bill = await this.prisma.bill.findUnique({
      where: { billId },
      include: { customer: true }
    });

    if (!bill) {
      throw new Error('Bill not found');
    }

    if (!bill.filePath || !fs.existsSync(path.join(process.cwd(), bill.filePath))) {
      throw new Error('Bill file not found. Generating new PDF...');
    }

    const buffer = fs.readFileSync(path.join(process.cwd(), bill.filePath));
    
    return {
      buffer,
      fileName: bill.fileName || `bill-${billId}.pdf`
    };
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

  async getBillDetails(billId: number) {
    return this.prisma.bill.findUnique({
      where: { billId },
      include: {
        customer: true
      }
    });
  }

  async clearBillFilePath(billId: number) {
    return this.prisma.bill.update({
      where: { billId },
      data: {
        filePath: null,
        fileName: null
      }
    });
  }
}
