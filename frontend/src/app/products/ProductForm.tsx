'use client';
import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { Product, CreateProductDto, Store, productApi } from './product';

interface ProductFormProps {
  product?: Product;
  onSuccess: () => void;
  onCancel: () => void;
  isEdit?: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({ product, onSuccess, onCancel, isEdit = false }) => {
  const [formData, setFormData] = useState<CreateProductDto>({
    productName: '',
    currentProductPrice: 0,
    lastProductPrice: 0,
    imageUrl: '',
    description: '',
    storeId: Store.SANCHI,
  });
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewImage, setPreviewImage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (product && isEdit) {
      setFormData({
        productName: product.productName,
        currentProductPrice: product.currentProductPrice,
        lastProductPrice: product.lastProductPrice || 0,
        imageUrl: product.imageUrl || '',
        description: product.description || '',
        storeId: product.storeId,
      });
      setPreviewImage(product.imageUrl ? productApi.getImageUrl(product.imageUrl) : '');
    }
  }, [product, isEdit]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.productName.trim()) newErrors.productName = 'Product name is required';
    if (formData.currentProductPrice <= 0) newErrors.currentProductPrice = 'Current price must be greater than 0';
    if (formData.lastProductPrice && formData.lastProductPrice < 0) newErrors.lastProductPrice = 'Last price cannot be negative';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    setLoading(true);
    try {
      let response;
      if (isEdit && product) {
        response = await productApi.updateProduct(product.productId, formData);
      } else {
        response = await productApi.createProduct(formData);
      }

      if (response.success) {
        toast.success(response.message);
        onSuccess();
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} product`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name.includes('Price') ? parseFloat(value) || 0 : value 
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setImageUploading(true);
    try {
      const response = await productApi.uploadImage(file);
      
      // ✅ FIXED: Proper type checking and handling
      if (response.success && response.data) {
        // Type guard to ensure we have the right data structure
        if (typeof response.data === 'object' && 'imageUrl' in response.data) {
          const imageUrl = response.data.imageUrl as string; // Safe type assertion
          
          if (imageUrl && typeof imageUrl === 'string') {
            setFormData(prev => ({ ...prev, imageUrl }));
            setPreviewImage(productApi.getImageUrl(imageUrl));
            toast.success('Image uploaded successfully');
          } else {
            toast.error('Invalid image URL received');
          }
        } else {
          toast.error('Invalid response format from server');
        }
      } else {
        toast.error(response.message || 'Failed to upload image');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setImageUploading(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    setPreviewImage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {isEdit ? 'Edit Product' : 'Add New Product'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
          <input
            type="text"
            name="productName"
            value={formData.productName}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.productName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter product name"
          />
          {errors.productName && <p className="text-red-500 text-sm mt-1">{errors.productName}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Price *</label>
            <input
              type="number"
              name="currentProductPrice"
              value={formData.currentProductPrice}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.currentProductPrice ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.currentProductPrice && <p className="text-red-500 text-sm mt-1">{errors.currentProductPrice}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Price (Optional)</label>
            <input
              type="number"
              name="lastProductPrice"
              value={formData.lastProductPrice || ''}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.lastProductPrice ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.lastProductPrice && <p className="text-red-500 text-sm mt-1">{errors.lastProductPrice}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Store *</label>
          <select
            name="storeId"
            value={formData.storeId}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={Store.SANCHI}>SANCHI</option>
            <option value={Store.SABORO}>SABORO</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter product description"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
          <div className="space-y-4">
            {previewImage && (
              <div className="relative inline-block">
                <img
                  src={previewImage}
                  alt="Product preview"
                  className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            )}
            
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                  imageUploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {imageUploading ? 'Uploading...' : 'Choose Image'}
              </label>
              <p className="text-sm text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading || imageUploading}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || imageUploading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
};
