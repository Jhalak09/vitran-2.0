// lib/product.ts
export interface Product {
  productId: number;
  productName: string;
  currentProductPrice: number;
  lastProductPrice?: number;
  imageUrl?: string;
  description?: string;
  storeId: Store;
  createdAt: string;
  updatedAt: string;
}

export enum Store {
  SANCHI = 'SANCHI',
  SABORO = 'SABORO'
}

export interface CreateProductDto {
  productName: string;
  currentProductPrice: number;
  lastProductPrice?: number;
  imageUrl?: string;
  description?: string;
  storeId: Store;
}

// ✅ IMPROVED: Better type definitions
export interface ImageUploadResponse {
  imageUrl: string;
}

export interface ProductResponse {
  success: boolean;
  message: string;
  data: Product | Product[] | ImageUploadResponse | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class ProductApiService {
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

  private async fetchWithFile<T>(url: string, formData: FormData): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async getAllProducts(): Promise<ProductResponse> {
    return this.fetchWithToast<ProductResponse>('/products');
  }

  async getProductById(id: number): Promise<ProductResponse> {
    return this.fetchWithToast<ProductResponse>(`/products/${id}`);
  }

  async getProductsByStore(store: Store): Promise<ProductResponse> {
    return this.fetchWithToast<ProductResponse>(`/products/by-store?store=${store}`);
  }

  async createProduct(productData: CreateProductDto): Promise<ProductResponse> {
    return this.fetchWithToast<ProductResponse>('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id: number, productData: Partial<CreateProductDto>): Promise<ProductResponse> {
    return this.fetchWithToast<ProductResponse>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(id: number): Promise<ProductResponse> {
    return this.fetchWithToast<ProductResponse>(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  async uploadImage(file: File): Promise<ProductResponse> {
    const formData = new FormData();
    formData.append('image', file);
    return this.fetchWithFile<ProductResponse>('/products/upload-image', formData);
  }

  getImageUrl(imageUrl: string): string {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${API_BASE_URL}${imageUrl}`;
  }
}

export const productApi = new ProductApiService();
