// lib/relation.ts
export interface Worker {
  workerId: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  customerId: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address1: string;
  address2?: string;
  city: string;
  pincode: string;
  classification: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  productId: number;
  productName: string;
  currentProductPrice: string | number; // ✅ Accept both string and number
  lastProductPrice?: string | number;    // ✅ Same for this field
  imageUrl?: string;
  description?: string;
  storeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkerCustomerRelation {
  id: number;
  workerId: number;
  customerId: number;
  fromDate: string;
  thruDate?: string;
  worker: Worker;
  customer: Customer;
  sequenceNumber?: number;
}

export interface CustomerProductRelation {
  id: number;
  customerId: number;
  productId: number;
  fromDate: string;
  thruDate?: string;
  quantityAssociated: number;
  customer: Customer;
  product: Product;
}

export interface RelationResponse {
  success: boolean;
  message: string;
  data: any;
}

export interface CustomerResponse {
  success: boolean;
  message: string;
  data: Customer[];
}

export interface WorkerResponse {
  data: Worker[];
}

export interface ProductResponse {
  success: boolean;
  message: string;
  data: Product[];
}


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class RelationApiService {
  // ✅ Helper method to get auth headers
  private getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  

private async fetchWithAuth<T>(url: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: { 
        ...this.getAuthHeaders(), 
        ...(options.headers as Record<string, string>)
      },
    });

    if (response.status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
      throw new Error('Authentication required. Please login again.');
    }

    if (response.status === 403) {
      throw new Error('Access denied. Admin privileges required.');
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
  // Worker-Customer Relations
  async getWorkerCustomerRelations(): Promise<RelationResponse> {
    return this.fetchWithAuth<RelationResponse>('/relations/worker-customers');
  }

  async assignCustomerToWorker({
    workerId,
    customerId,
    sequenceNumber
  }: {
    workerId: number;
    customerId: number;
    sequenceNumber: number;
  }): Promise<WorkerCustomerRelation> {
    // Send data in body as per backend requirements
    return this.fetchWithAuth('/relations/assign-customer-to-worker', {
      method: 'POST',
      body: JSON.stringify({ workerId, customerId, sequenceNumber })
    });
  }

  async deleteCustomerProductRelation(customerId: number, productId: number): Promise<RelationResponse> {
  return this.fetchWithAuth<RelationResponse>(`/relations/customer-product/${customerId}/${productId}`, {
    method: 'DELETE',
  });
}

  // Customer-Product Relations
  async getCustomerProductRelations(): Promise<RelationResponse> {
    return this.fetchWithAuth<RelationResponse>('/relations/customer-products');
  }

async assignProductToCustomer(
  customerId: number,
  productId: number,
  quantityAssociated: number = 1,
 
): Promise<RelationResponse> {
  return this.fetchWithAuth<RelationResponse>('/relations/assign-product-to-customer', {
    method: 'POST',
    body: JSON.stringify({ customerId, productId, quantityAssociated }),
  });
}


  async updateCustomerProductQuantity(
    customerId: number,
    productId: number,
    quantityAssociated: number
  ): Promise<RelationResponse> {
    return this.fetchWithAuth<RelationResponse>(`/relations/customer-product/${customerId}/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantityAssociated }),
    });
  }


  async deleteWorkerCustomerRelation(workerId: number, customerId: number): Promise<RelationResponse> {
  return this.fetchWithAuth<RelationResponse>(`/relations/worker-customer/${workerId}/${customerId}`, {
    method: 'DELETE',
  });
}

  // Helper methods
  async getAvailableCustomersForWorker(workerId: number): Promise<RelationResponse> {
    return this.fetchWithAuth<RelationResponse>(`/relations/available-customers/${workerId}`);
  }

  async getAvailableProductsForCustomer(customerId: number): Promise<RelationResponse> {
    return this.fetchWithAuth<RelationResponse>(`/relations/available-products/${customerId}`);
  }

  // ✅ Updated with JWT authentication
  async getAllWorkers(): Promise<RelationResponse> {
    try {
      const workersArray = await this.fetchWithAuth<Worker[]>('/workers');
      return {
        success: true,
        message: 'Workers retrieved successfully',
        data: workersArray
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch workers',
        data: []
      };
    }
  }

  async getAllCustomers(): Promise<RelationResponse> {
    try {
      const response = await this.fetchWithAuth<CustomerResponse>('/customers');
      return {
        success: response.success,
        message: response.message,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch customers',
        data: []
      };
    }
  }

  async getAllProducts(): Promise<RelationResponse> {
    try {
      const response = await this.fetchWithAuth<ProductResponse>('/products');
      return {
        success: response.success,
        message: response.message,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch products',
        data: []
      };
    }
  }

  getImageUrl(imageUrl: string): string {
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    return `${API_BASE_URL}${imageUrl}`;
  }
}

export const relationApi = new RelationApiService();
