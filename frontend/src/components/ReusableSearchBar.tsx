'use client';

import React from 'react';
import { ReactTransliterate } from 'react-transliterate';
import 'react-transliterate/dist/index.css';

// ✅ Props interface for the reusable search bar
interface ReusableSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  enableHindi?: boolean;
  width?: string;
  className?: string;
}

// ✅ Hindi-enabled SearchBar (extracted directly from your working code)
export function HindiSearchBar({
  value,
  onChange,
  placeholder = "Search...",
  width = "100%",
  className = ""
}: ReusableSearchBarProps) {
  return (
    <div style={{ position: 'relative' }} className={className}>
      <ReactTransliterate
        value={value}
        onChangeText={(text) => onChange(text)}
        lang="hi"
        renderComponent={(props) => (
          <input
            {...props}
            type="text"
            placeholder={placeholder}
            style={{
              width: width,
              padding: '12px 16px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '1rem',
              outline: 'none',
              transition: 'border-color 0.2s ease',
              paddingRight: value ? '40px' : '16px',
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
        )}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
            fontSize: '1.25rem',
            padding: '0',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

// ✅ English-only SearchBar (same styling, no transliteration)
export function EnglishSearchBar({
  value,
  onChange,
  placeholder = "Search...",
  width = "100%",
  className = ""
}: ReusableSearchBarProps) {
  return (
    <div style={{ position: 'relative' }} className={className}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: width,
          padding: '12px 16px',
          border: '2px solid #e2e8f0',
          borderRadius: '8px',
          fontSize: '1rem',
          outline: 'none',
          transition: 'border-color 0.2s ease',
          paddingRight: value ? '40px' : '16px',
        }}
        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
            fontSize: '1.25rem',
            padding: '0',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

// ✅ Universal SearchBar (can toggle between Hindi and English)
export function ReusableSearchBar({
  value,
  onChange,
  placeholder = "Search...",
  enableHindi = false,
  width = "100%",
  className = ""
}: ReusableSearchBarProps) {
  if (enableHindi) {
    return (
      <HindiSearchBar
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        width={width}
        className={className}
      />
    );
  }

  return (
    <EnglishSearchBar
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      width={width}
      className={className}
    />
  );
}

// ✅ Table-specific SearchBar (commonly used in tables)
export function TableSearchBar({
  value,
  onChange,
  placeholder = "Search...",
  enableHindi = false,
  width = "250px"
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  enableHindi?: boolean;
  width?: string;
}) {
  return (
    <ReusableSearchBar
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      enableHindi={enableHindi}
      width={width}
    />
  );
}
