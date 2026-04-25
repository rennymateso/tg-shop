export default function Loading() {
  return (
    <main className="min-h-screen bg-[#F5F5F5] px-4 pt-5 pb-32">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-[42px] w-[90px] rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.04)]" />
        <div className="h-[42px] w-[42px] rounded-2xl bg-white shadow-[0_4px_16px_rgba(0,0,0,0.04)]" />
      </div>

      <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
        <div className="aspect-[3/4] w-full animate-pulse bg-[#EAEAEA]" />

        <div className="p-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="h-3 w-24 animate-pulse rounded bg-[#ECECEC]" />
            <div className="h-3 w-20 animate-pulse rounded bg-[#ECECEC]" />
          </div>

          <div className="mb-4 flex items-center gap-2">
            <div className="h-4 w-16 animate-pulse rounded bg-[#ECECEC]" />
            <div className="h-6 w-24 animate-pulse rounded bg-[#ECECEC]" />
            <div className="h-5 w-12 animate-pulse rounded-full bg-[#ECECEC]" />
          </div>

          <div className="mt-5">
            <div className="mb-2 h-4 w-16 animate-pulse rounded bg-[#ECECEC]" />
            <div className="grid grid-cols-5 gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={`size-${i}`}
                  className="h-[46px] animate-pulse rounded-xl bg-[#F3F3F3]"
                />
              ))}
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 h-4 w-12 animate-pulse rounded bg-[#ECECEC]" />
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={`color-${i}`}
                  className="h-9 w-9 animate-pulse rounded-lg bg-[#F3F3F3]"
                />
              ))}
            </div>
          </div>

          <div className="mt-4 flex gap-2 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={`thumb-${i}`}
                className="h-16 w-12 shrink-0 animate-pulse rounded-xl bg-[#F3F3F3]"
              />
            ))}
          </div>

          <div className="mt-5 h-7 w-48 animate-pulse rounded bg-[#ECECEC]" />

          <div className="mt-5 space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-[#ECECEC]" />
            <div className="h-4 w-[92%] animate-pulse rounded bg-[#ECECEC]" />
            <div className="h-4 w-[80%] animate-pulse rounded bg-[#ECECEC]" />
          </div>

          <div className="mt-6 flex items-center justify-between rounded-2xl bg-[#F7F7F7] px-4 py-3">
            <div className="h-4 w-36 animate-pulse rounded bg-[#ECECEC]" />
            <div className="h-5 w-10 animate-pulse rounded bg-[#ECECEC]" />
          </div>

          <div className="mt-5 h-[54px] w-full animate-pulse rounded-2xl bg-[#EAEAEA]" />
        </div>
      </div>
    </main>
  );
}