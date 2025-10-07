import toast from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface Customer {
  customerId: number;
  firstName: string;
  lastName: string;
  address1: string;
  city: string;
  phoneNumber: string;
}

export interface Bill {
  billId: number;
  billNumber: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  isPaid: boolean;
  createdAt: string;
  filePath?: string;
  fileName?: string;
  fileExists?: boolean;
  customer?: Customer;
}

export interface BillPreview {
  customer: Customer;
  productSummary: Array<{
    productName: string;
    totalQuantity: number;
    unitPrice: number;
    totalAmount: number;
  }>;
  totalAmount: number;
  deliveryCharges: number;
  grandTotal: number;
}

// API Service Class
export class BillApiService {
  static async fetchCustomers(): Promise<Customer[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/customers`);
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      toast.error('Failed to fetch customers');
      return [];
    }
  }

  static async fetchCustomerBills(customerId: number): Promise<Bill[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/bills/customer/${customerId}`);
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      toast.error('Failed to fetch bills');
      return [];
    }
  }

  static async previewBill(params: {
    customerId: number;
    startDate: string;
    endDate: string;
    includeDeliveryCharges: boolean;
  }): Promise<BillPreview | null> {
    try {
      const searchParams = new URLSearchParams({
        customerId: params.customerId.toString(),
        startDate: params.startDate,
        endDate: params.endDate,
        includeDeliveryCharges: params.includeDeliveryCharges.toString()
      });

      const response = await fetch(`${API_BASE_URL}/bills/preview?${searchParams}`);
      const data = await response.json();
      
      if (data.success) {
        if (data.data.deliveries && data.data.deliveries.length === 0) {
          toast('No unbilled deliveries found for the selected period');
        }
        return data.data;
      } else {
        toast.error(data.message);
        return null;
      }
    } catch (error) {
      toast.error('Failed to preview bill');
      return null;
    }
  }

  static async generateBill(params: {
    customerId: number;
    startDate: string;
    endDate: string;
    includeDeliveryCharges: boolean;
    createdBy: string;
  }): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/bills/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Bill generated successfully! File saved as: ${data.data.fileName || 'bill.pdf'}`);
        return true;
      } else {
        toast.error(data.message);
        return false;
      }
    } catch (error) {
      toast.error('Failed to generate bill');
      return false;
    }
  }

  static async downloadBill(billId: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/bills/download/${billId}`);
      
      if (!response.ok) {
        throw new Error('Failed to download bill');
      }
      
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `bill-${billId}.pdf`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]*)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Bill downloaded successfully');
    } catch (error) {
      toast.error('Failed to download bill');
    }
  }

  static async previewBillPDF(billId: number): Promise<void> {
    try {
      const url = `${API_BASE_URL}/bills/serve/${billId}`;
      window.open(url, '_blank');
      toast.success('Opening bill preview...');
    } catch (error) {
      toast.error('Failed to preview bill');
    }
  }

  static async markBillPaid(billId: number): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/bills/${billId}/mark-paid`, {
        method: 'PATCH'
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Bill marked as paid');
        return true;
      } else {
        toast.error(data.message);
        return false;
      }
    } catch (error) {
      toast.error('Failed to mark bill as paid');
      return false;
    }
  }

  static async deleteBillFile(billId: number): Promise<boolean> {
    if (!confirm('Are you sure you want to delete this bill file?')) {
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/bills/${billId}/file`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Bill file deleted successfully');
        return true;
      } else {
        toast.error(data.message);
        return false;
      }
    } catch (error) {
      toast.error('Failed to delete bill file');
      return false;
    }
  }

  static async sendBillViaWhatsApp(
    billId: number, 
    customerName: string
  ): Promise<boolean> {
    if (!confirm(`Send bill via WhatsApp to ${customerName}?`)) {
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/twilio/send-bill/${billId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`✅ Bill sent to ${customerName} via WhatsApp!`);
        return true;
      } else {
        toast.error(`❌ Failed to send WhatsApp: ${data.message}`);
        return false;
      }
    } catch (error) {
      toast.error('❌ Failed to send bill via WhatsApp');
      return false;
    }
  }
}
