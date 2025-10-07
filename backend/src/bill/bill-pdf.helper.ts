import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

export interface BillPDFData {
  bill: {
    billId: number;
    billNumber: string;
    startDate: Date;
    endDate: Date;
    totalAmount: number;
    deliveryCharges?: number;
    customer: {
      firstName: string;
      lastName?: string;
      address1: string;
      address2?: string;
      city?: string;
      pincode?: string;
      phoneNumber?: string;
    };
  };
  deliveries: Array<{
    verifiedAt: Date;
    productName: string;
    deliveredQuantity: number;
    bill: number;
  }>;
  productSummary: Array<{
    productName: string;
    totalQuantity: number;
    unitPrice: number;
    totalAmount: number;
  }>;
}

export class BillPDFGenerator {
  static async generatePDF(data: BillPDFData): Promise<Buffer> {
    const { bill, deliveries, productSummary } = data;

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          margin: 50, 
          size: 'A4'
        });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          resolve(Buffer.concat(buffers));
        });

        // =============== FIRST PAGE - PROFESSIONAL DESIGN ===============

        // Company Header - Clean and Professional
        
        doc.fillColor('#1a365d')
           .fontSize(22)
           .font('Helvetica-Bold')
           .text('जय श्री कृष्णा', 50, 50);

        doc.fillColor('#1a365d')
           .fontSize(22)
           .font('Helvetica-Bold')
           .text('Vidhan Sanchi Milk Depot', 50, 50);

        // Blue underline
        doc.strokeColor('#2b77ad')
           .lineWidth(2)
           .moveTo(50, 80)
           .lineTo(350, 80)
           .stroke();

        // Company details with date below
        doc.fillColor('#4a5568')
           .fontSize(11)
           .font('Helvetica')
           .text('200-D, Vidur Nagar, Water Tank, Indore', 50, 95)
           .text('Mo.9826987703', 50, 110)
           .text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 50, 125);

        // Customer name and address directly (no "Mr." or "Address" labels)
        const customerName = `${bill.customer.firstName} ${bill.customer.lastName || ''}`;
        doc.fillColor('#2d3748')
           .fontSize(13)
           .font('Helvetica')
           .text(customerName, 50, 160);

        const customerAddress = `${bill.customer.address1}${bill.customer.address2 ? ', ' + bill.customer.address2 : ''}, ${bill.customer.city || ''} ${bill.customer.pincode || ''}`;
        doc.fillColor('#2d3748')
           .fontSize(13)
           .font('Helvetica')
           .text(customerAddress, 50, 180, { width: 400 });

        // Date Range
        const startDate = new Date(bill.startDate);
        const endDate = new Date(bill.endDate);
        
        doc.fillColor('#1a365d')
           .fontSize(12)
           .font('Helvetica-Bold')
           .text(`From Date: ${startDate.toLocaleDateString('en-IN')} To Date: ${endDate.toLocaleDateString('en-IN')}`, 50, 210);

        // Table Header
        const tableTop = 250;
        const tableHeaders = ['Product', 'Total Packets', 'Rate', 'Amount']; // Changed from 'Product Type' to 'Product'
        const colWidths = [180, 100, 80, 100];

        // Header row with blue background
        doc.rect(50, tableTop, 460, 30)
           .fillColor('#2b6cb0')
           .fill();

        let currentX = 50;
        doc.fillColor('#ffffff')
           .fontSize(11)
           .font('Helvetica-Bold');

        tableHeaders.forEach((header, i) => {
          const textAlign = i === 0 ? 'left' : 'center';
          const padding = i === 0 ? 10 : 0;
          doc.text(header, currentX + padding, tableTop + 10, { 
            width: colWidths[i], 
            align: textAlign 
          });
          currentX += colWidths[i];
        });

        let currentY = tableTop + 30;

        // Product rows - clean style
        productSummary.forEach((item, index) => {
          const rowHeight = 25;
          
          // Alternate row colors
          if (index % 2 === 0) {
            doc.rect(50, currentY, 460, rowHeight)
               .fillColor('#f7fafc')
               .fill();
          }

          // Row border
          doc.rect(50, currentY, 460, rowHeight)
             .strokeColor('#e2e8f0')
             .stroke();

          currentX = 50;
          doc.fillColor('#2d3748')
             .fontSize(10)
             .font('Helvetica');

          // Product name
          doc.text(item.productName, currentX + 10, currentY + 8, { width: colWidths[0] - 20 }); // Increased padding to avoid overlap
          currentX += colWidths[0];

          // Packets
          doc.text(item.totalQuantity.toString(), currentX, currentY + 8, { 
            width: colWidths[1], 
            align: 'center' 
          });
          currentX += colWidths[1];

          // Rate
          doc.text(`₹${item.unitPrice.toFixed(2)}`, currentX, currentY + 8, { 
            width: colWidths[2], 
            align: 'center' 
          });
          currentX += colWidths[2];

          // Amount
          doc.font('Helvetica-Bold')
             .text(`₹${item.totalAmount.toFixed(2)}`, currentX, currentY + 8, { 
               width: colWidths[3], 
               align: 'center' 
             });

          currentY += rowHeight;
        });

        // Delivery Charges (if any)
        if (bill.deliveryCharges && Number(bill.deliveryCharges) > 0) {
          const rowHeight = 25;
          
          doc.rect(50, currentY, 460, rowHeight)
             .fillColor('#fef5e7')
             .fill()
             .strokeColor('#e2e8f0')
             .stroke();

          doc.fillColor('#2d3748')
             .fontSize(10)
             .font('Helvetica-Bold')
             .text('Delivery Charges', 60, currentY + 8)
             .text(`₹${Number(bill.deliveryCharges).toFixed(2)}`, 410, currentY + 8, { 
               width: 100, 
               align: 'center' 
             });

          currentY += rowHeight;
        }

        // Grand Total row
        const totalRowHeight = 35;
        doc.rect(50, currentY, 460, totalRowHeight)
           .fillColor('#1a365d')
           .fill();

        doc.fillColor('#ffffff')
           .fontSize(14)
           .font('Helvetica-Bold')
           .text('Grand Total', 60, currentY + 10)
           .fontSize(16)
           .text(`₹${Number(bill.totalAmount).toFixed(2)}`, 410, currentY + 8, { 
             width: 100, 
             align: 'center' 
           });

        currentY += totalRowHeight + 20;

        // Footer note
        if (currentY < 700) {
          doc.fillColor('#718096')
             .fontSize(9)
             .font('Helvetica')
             .text('Payment Terms: Due within 30 days. Thank you for your business!', 50, currentY + 20)
             .text('This is a computer generated bill.', 50, currentY + 35);
        }

        // =============== SECOND PAGE - MINIMAL DESIGN FOR DATA ===============
        
        doc.addPage();
        
        // Simple header - no design elements
        doc.fillColor('#1a365d')
           .fontSize(16)
           .font('Helvetica-Bold')
           .text('DELIVERY DETAILS', 50, 50);

        doc.fillColor('#4a5568')
           .fontSize(11)
           .font('Helvetica')
           .text(`Period: ${startDate.toLocaleDateString('en-IN')} to ${endDate.toLocaleDateString('en-IN')}`, 50, 75);

        // Simple table header - minimal styling
        const detailHeaders = ['Date', 'Product', 'Qty', 'Amount'];
        const detailColWidths = [80, 250, 60, 70];
        currentY = 100;

        // Header row - simple gray background
        doc.rect(50, currentY, 460, 20)
           .fillColor('#f1f5f9')
           .fill()
           .strokeColor('#cbd5e0')
           .stroke();

        currentX = 50;
        doc.fillColor('#2d3748')
           .fontSize(10)
           .font('Helvetica-Bold');

        detailHeaders.forEach((header, i) => {
          doc.text(header, currentX + 5, currentY + 6, { 
            width: detailColWidths[i] - 10, 
            align: i === 1 ? 'left' : 'center' 
          });
          currentX += detailColWidths[i];
        });

        currentY += 20;

        // Data rows - minimal styling for maximum data density
        deliveries.forEach((delivery, index) => {
          const rowHeight = 18; // Compact rows

          // Very light alternating colors
          if (index % 2 === 0) {
            doc.rect(50, currentY, 460, rowHeight)
               .fillColor('#fafafa')
               .fill();
          }

          // Light border
          doc.rect(50, currentY, 460, rowHeight)
             .strokeColor('#e5e7eb')
             .lineWidth(0.5)
             .stroke();

          currentX = 50;
          doc.fillColor('#374151')
             .fontSize(8)
             .font('Helvetica');

          // Date
          doc.text(delivery.verifiedAt.toLocaleDateString('en-IN'), currentX + 5, currentY + 5, { 
            width: detailColWidths[0] - 10, 
            align: 'center' 
          });
          currentX += detailColWidths[0];

          // Product
          doc.text(delivery.productName, currentX + 5, currentY + 5, { 
            width: detailColWidths[1] - 10 
          });
          currentX += detailColWidths[1];

          // Quantity
          doc.text(delivery.deliveredQuantity.toString(), currentX + 5, currentY + 5, { 
            width: detailColWidths[2] - 10, 
            align: 'center' 
          });
          currentX += detailColWidths[2];

          // Amount
          doc.font('Helvetica-Bold')
             .text(`₹${Number(delivery.bill).toFixed(2)}`, currentX + 5, currentY + 5, { 
               width: detailColWidths[3] - 10, 
               align: 'center' 
             });

          currentY += rowHeight;

          // Page break when needed
          if (currentY > 750) {
            doc.addPage();
            currentY = 50;
          }
        });

        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }
}
