"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { Tenant } from "@/lib/types";

interface TenantContextType {
  tenant: Tenant | null;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({
  children,
  tenant,
}: {
  children: ReactNode;
  tenant: Tenant | null;
}) {
  return (
    <TenantContext.Provider value={{ tenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}
