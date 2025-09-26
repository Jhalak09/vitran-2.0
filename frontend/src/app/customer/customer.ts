// lib/customer.ts
export interface Customer {
  customerId: number;
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  phoneNumber: string;
  role: UserRole;
  city: string;
  pincode: string;
  classification: CustomerClassification;
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
  WORKER = 'WORKER'
}

export enum CustomerClassification {
  B2B = 'B2B',
  B2C = 'B2C'
}

export interface CreateCustomerDto {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  phoneNumber: string;
  city: string;
  pincode: string;
  classification: CustomerClassification;
  // role removed - will default to CUSTOMER on backend
}

export interface CustomerResponse {
  success: boolean;
  message: string;
  data: Customer | Customer[] | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ;

class CustomerApiService {
  private async fetchWithToast<T>(url: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async getAllCustomers(): Promise<CustomerResponse> {
    return this.fetchWithToast<CustomerResponse>('/customers');
  }

  async createCustomer(customerData: CreateCustomerDto): Promise<CustomerResponse> {
    return this.fetchWithToast<CustomerResponse>('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  }

  async updateCustomer(id: number, customerData: Partial<CreateCustomerDto>): Promise<CustomerResponse> {
    return this.fetchWithToast<CustomerResponse>(`/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(customerData),
    });
  }
}

export const customerApi = new CustomerApiService();
