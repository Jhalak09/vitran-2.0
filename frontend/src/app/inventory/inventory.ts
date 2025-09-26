// lib/inventory.ts
export interface InventoryItem {
  inventoryId: number;
  productId: number;
  totalOrderedQuantity: number;
  receivedQuantity?: number;
  remainingQuantity?: number;
  distributedQuantity?: number;
  entryByUserLoginId?: string;
  lastUpdated: string;
  date: string;
  product: {
    productId: number;
    productName: string;
    currentProductPrice: number;
    storeId: string;
    imageUrl?: string;
  };
}

export interface InventoryResponse {
  success: boolean;
  message: string;
  data: InventoryItem[];
}

export interface UpdateInventoryResponse {
  success: boolean;
  message: string;
  data?: any;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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

  // Get inventory summary
  async getInventorySummary(date?: string): Promise<InventoryResponse> {
    const params = date ? `?date=${date}` : '';
    return this.fetchWithAuth<InventoryResponse>(`/inventory/summary${params}`);
  }

  // Update all inventories
  async updateAllInventories(userId?: string): Promise<UpdateInventoryResponse> {
    return this.fetchWithAuth<UpdateInventoryResponse>('/inventory/update-all', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  // Update specific product inventory
  async updateProductInventory(productId: number, userId?: string): Promise<UpdateInventoryResponse> {
    return this.fetchWithAuth<UpdateInventoryResponse>(`/inventory/update-product/${productId}`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

   // Update received quantity for specific date
  async updateReceivedQuantity(productId: number, receivedQuantity: number, userId: string, date?: string): Promise<UpdateInventoryResponse> {
    return this.fetchWithAuth<UpdateInventoryResponse>(`/inventory/received/${productId}`, {
      method: 'POST',
      body: JSON.stringify({ receivedQuantity, userId, date }),
    });
  }

  // ✅ NEW: Update remaining quantity (end of day)
  async updateRemainingQuantity(productId: number, remainingQuantity: number, userId: string, date?: string): Promise<UpdateInventoryResponse> {
    return this.fetchWithAuth<UpdateInventoryResponse>(`/inventory/remaining/${productId}`, {
      method: 'POST',
      body: JSON.stringify({ remainingQuantity, userId, date }),
    });
  }

  // Initialize today's inventory
  async initializeTodayInventory(userId?: string): Promise<UpdateInventoryResponse> {
    return this.fetchWithAuth<UpdateInventoryResponse>('/inventory/initialize-today', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  // Get available dates
  async getAvailableDates(): Promise<{success: boolean; data: string[]}> {
    return this.fetchWithAuth<{success: boolean; data: string[]}>('/inventory/dates');
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
