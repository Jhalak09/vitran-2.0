'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ReactTransliterate } from 'react-transliterate';
import 'react-transliterate/dist/index.css';

// ✅ EXACT SAME search logic from your WORKING SearchBar
const enhancedMultiWordSearch = (searchTerm: string, targetText: string): boolean => {
  if (!searchTerm || !targetText) return false;
  
  const normalizedTarget = targetText.toLowerCase().trim();
  const normalizedSearch = searchTerm.toLowerCase().trim();
  
  // Direct match (exact phrase)
  if (normalizedTarget.includes(normalizedSearch)) return true;
  
  // Split search term into words for multi-word search
  const searchWords = normalizedSearch.split(/\s+/).filter(word => word.length > 0);
  
  if (searchWords.length === 1) {
    // Single word search
    return normalizedTarget.includes(normalizedSearch);
  }
  
  // Multi-word search - all words must be present (can be in any order)
  return searchWords.every(word => normalizedTarget.includes(word));
};

// ✅ EXACT SAME customer search logic from your WORKING component
const createAdvancedCustomerSearch = (searchTerm: string, customer: any): boolean => {
  if (!searchTerm || !customer) return false;
  
  const fields = [
    customer.firstName || '',
    customer.lastName || '',
    customer.phoneNumber || '',
    customer.city || '',
    customer.classification || '',
    `${customer.firstName || ''} ${customer.lastName || ''}`.trim() // Full name
  ];
  
  // Search in each field
  return fields.some(field => enhancedMultiWordSearch(searchTerm, field));
};

// ✅ Generic option interface
export interface DropdownOption<T = any> {
  id: string | number;
  label: string;
  value: T;
  subtitle?: string;
  details?: string[];
  disabled?: boolean;
}

// ✅ Props interface
interface DropdownProps<T> {
  options: DropdownOption<T>[];
  selectedValue?: string | number | null;
  onSelect: (option: DropdownOption<T> | null) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  emptyMessage?: string;
  allowClear?: boolean;
  className?: string;
  error?: string;
  required?: boolean;
  loading?: boolean;
  enableHindi?: boolean;
}

// ✅ MAIN DROPDOWN with WORKING SearchBar logic
export function ReusableDropdown<T = any>({
  options = [],
  selectedValue,
  onSelect,
  placeholder = "Select an option...",
  label,
  disabled = false,
  emptyMessage = "No options found",
  allowClear = true,
  className = "",
  error,
  required = false,
  loading = false,
  enableHindi = false,
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // ✅ SAME as working SearchBar
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ✅ SAME filtering logic as your WORKING component
  const filteredOptions = enableHindi ? 
    // For Hindi (customers) - use the EXACT same advanced search
    options.filter(option => {
      if (!searchTerm.trim()) return true;
      // Use the customer search logic that works in your SearchBar
      return createAdvancedCustomerSearch(searchTerm, option.value);
    }) :
    // For English (products) - simple search
    options.filter(option => {
      if (!searchTerm.trim()) return true;
      const searchableText = [
        option.label || '',
        option.subtitle || '',
        ...(option.details || [])
      ].join(' ');
      return enhancedMultiWordSearch(searchTerm, searchableText);
    });

  // Get selected option
  const selectedOption = options.find(option => option.id === selectedValue);
  const displayValue = selectedOption ? selectedOption.label : '';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: DropdownOption<T>) => {
    onSelect(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (isOpen) {
        setSearchTerm('');
      }
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* Main select button */}
      <div
        className={`w-full px-3 py-2 border rounded-md bg-white cursor-pointer transition-colors ${
          disabled ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-gray-400'
        } ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${
          isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''
        }`}
        onClick={handleToggle}
      >
        <div className="flex items-center justify-between">
          <span className={`${!selectedValue ? 'text-gray-500' : 'text-gray-900'} truncate`}>
            {loading ? 'Loading...' : (displayValue || placeholder)}
          </span>
          <div className="flex items-center space-x-1">
            {selectedValue && allowClear && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600 p-1 rounded"
                tabIndex={-1}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}

      {/* Dropdown menu */}
      {isOpen && !disabled && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg overflow-hidden">
          {/* ✅ EXACT SAME search input as your WORKING SearchBar */}
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="relative">
              {enableHindi ? (
                // ✅ EXACT SAME ReactTransliterate setup as your WORKING SearchBar
                <ReactTransliterate
                  value={searchTerm}
                  onChangeText={(text) => setSearchTerm(text)} // ✅ SAME as working SearchBar
                  lang="hi"
                  renderComponent={(props) => (
                    <input
                      {...props}
                      type="text"
                      placeholder="Search: 'ram ji' or 'राम जी'..." // ✅ SAME placeholder as working SearchBar
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ paddingRight: searchTerm ? '40px' : '16px' }}
                    />
                  )}
                />
              ) : (
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search products..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ paddingRight: searchTerm ? '40px' : '16px' }}
                />
              )}
              
              {/* Clear button - SAME as working SearchBar */}
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <div className="text-sm">
                  {searchTerm ? `No results found for "${searchTerm}"` : emptyMessage}
                </div>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-blue-600 hover:text-blue-800 text-xs mt-2 underline"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.id}
                  className={`px-4 py-3 cursor-pointer text-sm hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                    option.disabled 
                      ? 'opacity-50 cursor-not-allowed' 
                      : selectedValue === option.id
                        ? 'bg-blue-100'
                        : ''
                  }`}
                  onClick={() => !option.disabled && handleSelect(option)}
                >
                  <div className="font-medium text-gray-900">
                    {option.label}
                  </div>
                  {option.subtitle && (
                    <div className="text-xs text-gray-600 mt-1">
                      {option.subtitle}
                    </div>
                  )}
                  {option.details && option.details.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {option.details.join(' • ')}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Search info footer */}
          {filteredOptions.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
              {searchTerm ? 
                `${filteredOptions.length} of ${options.length} items match "${searchTerm}"` :
                `${options.length} items total`
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ✅ Preset Components
export function EnglishDropdown<T>(props: Omit<DropdownProps<T>, 'enableHindi'>) {
  return <ReusableDropdown {...props} enableHindi={false} />;
}

export function HindiDropdown<T>(props: Omit<DropdownProps<T>, 'enableHindi'>) {
  return <ReusableDropdown {...props} enableHindi={true} />;
}

// ✅ Helper functions
export const createDropdownOptions = <T,>(
  items: T[],
  getLabel: (item: T) => string,
  getId: (item: T) => string | number,
  getSubtitle?: (item: T) => string,
  getDetails?: (item: T) => string[]
): DropdownOption<T>[] => {
  return items.map(item => ({
    id: getId(item),
    label: getLabel(item),
    value: item,
    subtitle: getSubtitle?.(item),
    details: getDetails?.(item)
  }));
};

export const createSimpleOptions = (items: string[]): DropdownOption<string>[] => {
  return items.map(item => ({
    id: item,
    label: item,
    value: item
  }));
};
