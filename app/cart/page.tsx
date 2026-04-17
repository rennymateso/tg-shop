import { Suspense } from "react";
import CartPageClient from "./CartPageClient";

export default function CartPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F5F5]" />}>
      <CartPageClient />
    </Suspense>
  );
}