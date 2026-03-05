"use client";

import React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import ButtonDropdowns from './ButtonDropdowns';

interface NavigatingDropdownProps {
    options: (string | { label: string; value: string })[];
    value: string;
    paramName: string;
    icon?: React.ReactNode;
    className?: string;
}

export default function NavigatingDropdown({
    options,
    value,
    paramName,
    icon,
    className
}: NavigatingDropdownProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handleChange = (newValue: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (newValue === 'All Status' || newValue === 'All Types' || newValue === 'All Sources') {
            params.delete(paramName);
        } else {
            params.set(paramName, newValue);
        }
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <ButtonDropdowns
            options={options}
            value={value}
            onChange={handleChange}
            icon={icon}
            className={className}
        />
    );
}
