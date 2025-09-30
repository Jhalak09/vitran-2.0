export interface InventoryItem {
  inventoryId?: number;
  productId: number;
  receivedQuantity?: number;
  remainingQuantity?: number;
  entryByUserLoginId?: string;
  lastUpdated?: string;
  date?: string;
  product: {
    productId: number;
    productName: string;
    currentProductPrice: number;
    storeId: string;
    imageUrl?: string;
  };
  totalDemand?: number; // Add this for combined data
}

export interface InventoryResponse {
  success: boolean;
  message: string;
  data: InventoryItem[];
}

export interface DemandResponse {
  success: boolean;
  message: string;
  data: any[];
  meta?: {
    date: string;
    totalProducts: number;
    totalDemand: number;
    calculated: string;
  };
}

export interface UpdateInventoryResponse {
  success: boolean;
  message: string;
  data?: any;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ;

class InventoryApiService {
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
        headers: { ...this.getAuthHeaders(), ...options.headers },
      });

      if (response.status === 401) {
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

  // Get demand data
  async getDemandAll(date?: string): Promise<DemandResponse> {
    const url = date ? `/inventory/demand-all?date=${date}` : '/inventory/demand-all';
    return this.fetchWithAuth<DemandResponse>(url);
  }

  // Get inventory summary
  async getInventorySummary(date?: string): Promise<InventoryResponse> {
    const url = date ? `/inventory?date=${date}` : '/inventory';
    return this.fetchWithAuth<InventoryResponse>(url);
  }

  // Update all inventories
  async updateAllInventories(userId?: string): Promise<UpdateInventoryResponse> {
    return this.fetchWithAuth<UpdateInventoryResponse>('/inventory/update-all', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  // Update received quantity
  async updateReceivedQuantity(productId: number, receivedQuantity: number, userId: string): Promise<UpdateInventoryResponse> {
    return this.fetchWithAuth<UpdateInventoryResponse>(`/inventory/received/${productId}`, {
      method: 'POST',
      body: JSON.stringify({ receivedQuantity, userId }),
    });
  }

  // Update remaining quantity
  async updateRemainingQuantity(productId: number, remainingQuantity: number, userId: string): Promise<UpdateInventoryResponse> {
    return this.fetchWithAuth<UpdateInventoryResponse>(`/inventory/remaining/${productId}`, {
      method: 'POST',
      body: JSON.stringify({ remainingQuantity, userId }),
    });
  }

  // Helper method for image URLs
  getImageUrl(imageUrl: string): string {
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    return `${API_BASE_URL}${imageUrl}`;
  }
}

export const inventoryApi = new InventoryApiService();
