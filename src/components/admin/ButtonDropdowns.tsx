"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
    label: string;
    value: string;
}

interface ButtonDropdownsProps {
    options: (string | Option)[];
    value: string;
    onChange: (value: string) => void;
    icon?: React.ReactNode;
    className?: string;
}

export default function ButtonDropdowns({
    options,
    value,
    onChange,
    icon,
    className = ""
}: ButtonDropdownsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const formattedOptions = options.map(opt =>
        typeof opt === 'string' ? { label: opt, value: opt } : opt
    );

    const selectedOption = formattedOptions.find(opt => opt.value === value) || formattedOptions[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between gap-3 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-100 rounded-xl shadow-sm transition-all duration-200 group active:scale-95"
            >
                <div className="flex items-center gap-2">
                    {icon && <div className="text-gray-400 group-hover:text-[#ff4500] transition-colors">{icon}</div>}
                    <span className="text-sm font-bold text-gray-700 whitespace-nowrap">
                        {selectedOption?.label}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="relative mt-2 w-full min-w-[200px] bg-white border border-gray-100 rounded-2xl shadow-xl z-[100] overflow-hidden animate-in fade-in zoom-in duration-200 origin-top">
                    <div className="py-1 max-h-[350px] overflow-y-auto custom-scrollbar">
                        {formattedOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-gray-50 ${value === option.value
                                    ? 'text-[#ff4500] bg-orange-50/50'
                                    : 'text-gray-600'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
