import { Suspense } from "react";
import ProductPageClient from "./ProductPageClient";

export default function ProductPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F5F5]" />}>
      <ProductPageClient />
    </Suspense>
  );
}