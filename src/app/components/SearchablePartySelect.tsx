import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, X, User, Check } from 'lucide-react';
import { CustomerItem } from '../services/customerService';

interface SearchablePartySelectProps {
  value: number | '' | null;
  onChange: (id: number | '') => void;
  customers: CustomerItem[] | Array<{ id: number; name: string; customer_code?: string }>;
  label?: string;
  placeholder?: string;
  allowAll?: boolean;
  allLabel?: string;
  className?: string;
  labelColorClass?: string;
}

export default function SearchablePartySelect({
  value,
  onChange,
  customers,
  label = 'Party / Customer',
  placeholder = 'All Parties',
  allowAll = true,
  allLabel = 'All Parties',
  className = 'min-w-[220px] relative flex-1',
  labelColorClass = 'text-blue-600',
}: SearchablePartySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCustomer = useMemo(() => {
    if (!value) return null;
    return customers.find((c) => c.id === value) || null;
  }, [value, customers]);

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.customer_code && c.customer_code.toLowerCase().includes(q))
    );
  }, [customers, search]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleSelect = (id: number | '') => {
    onChange(id);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  return (
    <div className={className} ref={containerRef}>
      {label && (
        <label className={`absolute -top-2 left-3 bg-white px-1 text-[10px] font-black ${labelColorClass} uppercase tracking-wider z-10`}>
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold text-gray-700 text-sm bg-gray-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
          <User size={16} className="text-gray-400 flex-shrink-0" />
          <span className={`truncate ${selectedCustomer ? 'text-gray-800 font-bold' : 'text-gray-600'}`}>
            {selectedCustomer ? selectedCustomer.name : placeholder}
          </span>
          {selectedCustomer?.customer_code && (
            <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded font-mono font-bold flex-shrink-0">
              {selectedCustomer.customer_code}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {selectedCustomer && allowAll && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onChange('');
                }
              }}
              className="p-1 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
              title="Clear selection"
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-80 flex flex-col z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-gray-100 bg-gray-50">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search party name or code..."
                className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-400 font-semibold text-gray-800"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              {search && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearch('');
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="p-1.5 overflow-y-auto max-h-60">
            {allowAll && !search && (
              <div
                onClick={() => handleSelect('')}
                className={`px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-all flex justify-between items-center ${
                  !value ? 'bg-blue-50 border border-blue-100 font-bold text-blue-700' : 'hover:bg-gray-50 font-medium text-gray-700'
                }`}
              >
                <span>{allLabel}</span>
                {!value && <Check size={16} className="text-blue-600" />}
              </div>
            )}

            {filteredCustomers.length === 0 ? (
              <div className="p-4 text-sm text-gray-400 text-center flex flex-col items-center gap-1.5">
                <Search size={18} className="text-gray-300" />
                <p>No party found matching "{search}"</p>
              </div>
            ) : (
              filteredCustomers.map((c) => {
                const isSelected = value === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelect(c.id)}
                    className={`px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-all flex justify-between items-center ${
                      isSelected
                        ? 'bg-blue-50 border border-blue-100 font-bold text-blue-700'
                        : 'hover:bg-gray-50 font-medium text-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="truncate">{c.name}</span>
                      {c.customer_code && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-mono font-bold">
                          {c.customer_code}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check size={16} className="text-blue-600 flex-shrink-0 ml-2" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
