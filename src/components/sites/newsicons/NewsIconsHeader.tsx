"use client";

import { Suspense } from "react";
import { Header } from "@/components/Header";
import { NavBar } from "@/components/NavBar";

interface NewsIconsHeaderProps {
  onOpenNewsletter?: () => void;
}

export default function NewsIconsHeader({ onOpenNewsletter }: NewsIconsHeaderProps) {
  return (
    <>
      <Header onOpenNewsletter={onOpenNewsletter} />
      <Suspense fallback={<div className="h-12 bg-black" />}>
        <NavBar />
      </Suspense>
    </>
  );
}
