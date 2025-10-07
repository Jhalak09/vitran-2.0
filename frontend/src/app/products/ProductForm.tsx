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
    currentProductPrice: 1, // ✅ FIXED: Start with 1 instead of 0
    lastProductPrice: undefined, // ✅ FIXED: Use undefined instead of empty string
    imageUrl: '',
    description: '',
    storeId: Store.SANCHI,
  });
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewImage, setPreviewImage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (product && isEdit) {
      setFormData({
        productName: product.productName,
        currentProductPrice: product.currentProductPrice,
        lastProductPrice: product.lastProductPrice || undefined, // ✅ FIXED: Use undefined for empty lastProductPrice
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
    if (formData.lastProductPrice !== undefined && formData.lastProductPrice < 0) {
      newErrors.lastProductPrice = 'Last price cannot be negative';
    }
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
      // ✅ FIXED: Prepare data with proper lastProductPrice handling
      const submitData: CreateProductDto = {
        ...formData,
        // Only include lastProductPrice if it has a valid value
        ...(formData.lastProductPrice !== undefined && formData.lastProductPrice > 0 
          ? { lastProductPrice: formData.lastProductPrice } 
          : {}
        )
      };

      let response;
      if (isEdit && product) {
        response = await productApi.updateProduct(product.productId, submitData);
      } else {
        response = await productApi.createProduct(submitData);
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
    
    // ✅ FIXED: Better price handling
    if (name === 'currentProductPrice') {
      const numValue = parseInt(value) || 1; // Parse as integer, default to 1
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else if (name === 'lastProductPrice') {
      const numValue = value === '' ? undefined : (parseInt(value) || undefined); // ✅ FIXED: undefined for empty
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

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
      if (response.success && response.data) {
        if (typeof response.data === 'object' && 'imageUrl' in response.data) {
          const imageUrl = response.data.imageUrl as string;
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
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Name *
          </label>
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
          {errors.productName && (
            <p className="text-red-500 text-sm mt-1">{errors.productName}</p>
          )}
        </div>

        {/* Price Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Current Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Price (₹) *
            </label>
            <input
              type="number"
              name="currentProductPrice"
              value={formData.currentProductPrice}
              onChange={handleInputChange}
              min="1"
              step="1" // ✅ FIXED: Step by 1 rupee instead of 0.01
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.currentProductPrice ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter current price"
            />
            {errors.currentProductPrice && (
              <p className="text-red-500 text-sm mt-1">{errors.currentProductPrice}</p>
            )}
          </div>

          {/* Last Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Price (₹) <span className="text-gray-500">(Optional)</span>
            </label>
            <input
              type="number"
              name="lastProductPrice"
              value={formData.lastProductPrice || ''} // ✅ FIXED: Show empty string when undefined
              onChange={handleInputChange}
              min="0"
              step="1" // ✅ FIXED: Step by 1 rupee instead of 0.01
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.lastProductPrice ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter last price (leave blank if none)"
            />
            {errors.lastProductPrice && (
              <p className="text-red-500 text-sm mt-1">{errors.lastProductPrice}</p>
            )}
          </div>
        </div>

        {/* Store Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Store *
          </label>
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

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description <span className="text-gray-500">(Optional)</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter product description"
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Image
          </label>
          
          {previewImage && (
            <div className="mb-4 relative inline-block">
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
          
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label htmlFor="image-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                  <span>{imageUploading ? 'Uploading...' : 'Choose Image'}</span>
                  <input
                    id="image-upload"
                    ref={fileInputRef}
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={imageUploading}
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
};
