"use client";

function PulseBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-[#ECECEC] ${className}`} />;
}

export function HomePageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <PulseBlock className="mx-auto h-3 w-20" />
        <PulseBlock className="mx-auto mt-3 h-8 w-52 rounded-[14px]" />
      </div>

      <div className="rounded-[22px] bg-white px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
        <div className="h-5 w-full animate-pulse rounded-full bg-[#ECECEC]" />
      </div>

      <div className="overflow-hidden rounded-[24px] bg-white p-2 shadow-[0_10px_28px_rgba(0,0,0,0.05)]">
        <div className="h-[150px] w-full animate-pulse rounded-[20px] bg-[#ECECEC]" />
      </div>

      <div className="flex gap-2 overflow-hidden">
        {[1, 2, 3, 4].map((item) => (
          <PulseBlock key={item} className="h-8 w-20 shrink-0" />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="overflow-hidden rounded-[20px] bg-white p-0 shadow-[0_10px_28px_rgba(0,0,0,0.05)]"
          >
            <div className="aspect-[3/4] w-full animate-pulse bg-[#ECECEC]" />
            <div className="p-3">
              <PulseBlock className="h-3 w-20" />
              <PulseBlock className="mt-3 h-5 w-32 rounded-[10px]" />
              <PulseBlock className="mt-4 h-6 w-24 rounded-[10px]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FavoritesPageSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="overflow-hidden rounded-[20px] bg-white shadow-[0_10px_28px_rgba(0,0,0,0.05)]"
        >
          <div className="aspect-[3/4] w-full animate-pulse bg-[#ECECEC]" />
          <div className="p-3">
            <PulseBlock className="h-3 w-20" />
            <PulseBlock className="mt-3 h-5 w-32 rounded-[10px]" />
            <PulseBlock className="mt-4 h-6 w-24 rounded-[10px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CartLikeItemsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2].map((item) => (
        <div
          key={item}
          className="rounded-[24px] bg-white p-4 shadow-[0_8px_28px_rgba(0,0,0,0.05)]"
        >
          <div className="flex gap-4">
            <div className="aspect-[3/4] w-[88px] shrink-0 animate-pulse rounded-[18px] bg-[#ECECEC]" />

            <div className="flex-1">
              <PulseBlock className="h-3 w-24" />
              <PulseBlock className="mt-3 h-7 w-40 rounded-[10px]" />

              <div className="mt-4 flex gap-2">
                <div className="h-8 w-24 animate-pulse rounded-full bg-[#F3F3F3]" />
                <div className="h-8 w-24 animate-pulse rounded-full bg-[#F3F3F3]" />
              </div>

              <div className="mt-5 flex items-center justify-between">
                <PulseBlock className="h-7 w-24 rounded-[10px]" />

                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 animate-pulse rounded-full bg-[#F5F5F5]" />
                  <div className="h-6 w-6 animate-pulse rounded-full bg-[#ECECEC]" />
                  <div className="h-9 w-9 animate-pulse rounded-full bg-[#F5F5F5]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CheckoutPageSkeleton() {
  return (
    <div className="space-y-4">
      <CartLikeItemsSkeleton />

      <div className="rounded-[24px] bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
        <PulseBlock className="h-7 w-36 rounded-[10px]" />
        <PulseBlock className="mt-4 h-12 w-full rounded-2xl" />
        <PulseBlock className="mt-3 h-12 w-full rounded-2xl" />

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="h-12 animate-pulse rounded-2xl bg-[#ECECEC]" />
          <div className="h-12 animate-pulse rounded-2xl bg-[#ECECEC]" />
        </div>

        <PulseBlock className="mt-4 h-12 w-full rounded-2xl" />
        <PulseBlock className="mt-3 h-24 w-full rounded-2xl" />

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="h-12 animate-pulse rounded-2xl bg-[#ECECEC]" />
          <div className="h-12 animate-pulse rounded-2xl bg-[#ECECEC]" />
        </div>

        <div className="mt-4 rounded-2xl bg-[#F7F7F7] p-4">
          <PulseBlock className="h-4 w-full rounded-[8px]" />
          <PulseBlock className="mt-3 h-4 w-full rounded-[8px]" />
          <PulseBlock className="mt-3 h-4 w-full rounded-[8px]" />
        </div>

        <div className="mt-4 h-14 animate-pulse rounded-2xl bg-[#ECECEC]" />
      </div>
    </div>
  );
}

export function ProfilePageSkeleton() {
  return (
    <div className="space-y-3">
      <div className="rounded-[24px] bg-white p-5 shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 animate-pulse rounded-full bg-[#ECECEC]" />
          <div className="flex-1">
            <PulseBlock className="h-6 w-32 rounded-[10px]" />
            <PulseBlock className="mt-3 h-4 w-24 rounded-[8px]" />
            <PulseBlock className="mt-3 h-4 w-36 rounded-[8px]" />
          </div>
        </div>
      </div>

      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="rounded-[24px] bg-white p-4 shadow-[0_8px_28px_rgba(0,0,0,0.05)]"
        >
          <PulseBlock className="h-5 w-32 rounded-[8px]" />
          <PulseBlock className="mt-3 h-4 w-44 rounded-[8px]" />
        </div>
      ))}

      <div className="rounded-[24px] bg-white p-4 shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
        <PulseBlock className="h-5 w-24 rounded-[8px]" />
        <PulseBlock className="mt-3 h-4 w-40 rounded-[8px]" />
      </div>
    </div>
  );
}