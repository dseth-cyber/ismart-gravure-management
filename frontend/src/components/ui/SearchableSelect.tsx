'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-provider';

export interface Option {
  value: string;
  label: string;
}

export interface SearchableSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options: Option[];
  searchable?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export default function SearchableSelect({
  label,
  value,
  onChange,
  placeholder = 'Select...',
  options = [],
  searchable,
  disabled = false,
  required = false,
  className = '',
}: SearchableSelectProps) {
  const { themeConfig } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-enable search if there are more than 5 options and searchable is not explicitly false
  const shouldShowSearch = searchable !== undefined ? searchable : options.length > 5;

  // Prepend a clear/placeholder option if it's a filter context (no label) and doesn't already have empty value option
  const resolvedOptions = React.useMemo(() => {
    const hasEmpty = options.some(opt => opt.value === '');
    // If it's filter context (no label) and has no empty option, prepend the placeholder as empty option
    if (!label && !hasEmpty && placeholder) {
      return [{ value: '', label: placeholder }, ...options];
    }
    return options;
  }, [options, label, placeholder]);

  // Click outside detection
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Find currently selected option
  const selectedOption = resolvedOptions.find(opt => opt.value === value);

  // Filter options based on search query
  const filteredOptions = resolvedOptions.filter(opt =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className={`relative flex flex-col gap-1.5 w-full text-sm ${className}`}>
      {label && (
        <span className={`font-semibold flex items-center gap-0.5 ${themeConfig.textSecondary}`}>
          {label}
          {required && <span className="text-red-500 font-bold">*</span>}
        </span>
      )}

      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`flex min-h-10 w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition-all duration-200 ${
            disabled
              ? 'opacity-50 cursor-not-allowed bg-white/5 border-white/10 text-gray-500'
              : `${themeConfig.input} ${themeConfig.border} cursor-pointer hover:border-white/40`
          } ${themeConfig.focusRing}`}
        >
          <span className={selectedOption ? themeConfig.textPrimary : themeConfig.textMuted}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 shrink-0 ${themeConfig.textMuted} ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isOpen && !disabled && (
          <div
            className={`absolute z-50 mt-1 w-full overflow-hidden rounded-lg p-1 border shadow-xl backdrop-blur-2xl focus:outline-none ${
              themeConfig.name === 'modern'
                ? 'bg-indigo-950/95 border-white/20 text-white'
                : themeConfig.name === 'dark'
                ? 'bg-gray-950/95 border-gray-800 text-gray-100'
                : 'bg-white border-gray-200 text-gray-900 shadow-gray-200/80'
            }`}
          >
            {shouldShowSearch && (
              <div className="relative p-1 border-b border-white/10 mb-1 flex items-center">
                <Search size={14} className={`absolute left-3 ${themeConfig.textMuted}`} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full py-1 pl-8 pr-3 text-xs rounded border outline-none ${
                    themeConfig.name === 'modern'
                      ? 'bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-cyan-300'
                      : themeConfig.name === 'dark'
                      ? 'bg-gray-900 border-gray-800 text-gray-100 placeholder:text-gray-500 focus:border-blue-500'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-600'
                  }`}
                  autoFocus
                />
              </div>
            )}

            <div className="overflow-y-auto max-h-48 py-0.5">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <div
                      key={opt.value}
                      onClick={() => handleSelect(opt.value)}
                      className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors duration-150 text-sm ${
                        isSelected
                          ? themeConfig.name === 'modern'
                            ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                            : 'bg-blue-500/20 text-blue-400 font-semibold'
                          : themeConfig.name === 'light'
                          ? 'hover:bg-gray-100 text-gray-700'
                          : 'hover:bg-white/10 text-gray-300'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <Check size={14} className="shrink-0" />}
                    </div>
                  );
                })
              ) : (
                <div className={`px-3 py-2 text-center text-xs ${themeConfig.textMuted}`}>
                  No options found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
