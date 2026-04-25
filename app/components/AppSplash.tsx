"use client";

export default function AppSplash() {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#F5F5F5]">
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-[0.24em] text-gray-400">
          Menswear
        </p>

        <h1 className="mt-3 text-[26px] font-light tracking-[0.28em] text-black">
          MONTREAUX
        </h1>

        <div className="mt-7 flex items-center justify-center gap-2">
          <span className="h-2 w-2 animate-bounce rounded-full bg-black [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-black [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-black" />
        </div>
      </div>
    </div>
  );
}