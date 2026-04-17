import { Suspense } from "react";
import CheckoutPageClient from "./CheckoutPageClient";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F5F5]" />}>
      <CheckoutPageClient />
    </Suspense>
  );
}