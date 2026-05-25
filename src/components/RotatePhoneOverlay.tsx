import React from 'react';
import { RotateCcw, Smartphone } from 'lucide-react';

export const RotatePhoneOverlay: React.FC = () => {
  return (
    <div
      data-testid="rotate-phone-overlay"
      className="fixed inset-0 z-[2147483647] flex items-center justify-center overflow-hidden bg-zinc-950 text-white px-6 py-8"
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-sky-950 via-zinc-950 to-indigo-950" />
      <div className="absolute inset-0 bg-black/20 backdrop-blur-2xl" />

      <div className="relative flex w-full max-w-xs flex-col items-center gap-5 rounded-3xl border border-white/15 bg-white/10 p-6 text-center shadow-2xl backdrop-blur-2xl">
        <div className="relative h-24 w-24">
          <div className="absolute inset-3 rounded-[22px] border-2 border-white/70 bg-white/10 shadow-inner" />
          <Smartphone className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 text-white/90" />
          <RotateCcw className="absolute -right-1 top-0 h-7 w-7 text-sky-300" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-white">Rotate Your Phone</h1>
          <p className="text-sm leading-relaxed text-white/75">
            This macOS workspace is designed for landscape on phones.
          </p>
        </div>
      </div>
    </div>
  );
};
