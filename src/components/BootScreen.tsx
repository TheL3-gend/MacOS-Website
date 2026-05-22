import React, { useEffect, useRef } from 'react';
import { useWindowStore } from '../store/useWindowStore';
import gsap from 'gsap';
import { Apple } from 'lucide-react';

export const BootScreen: React.FC = () => {
  const bootSystem = useWindowStore((state) => state.bootSystem);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate progress bar filling
      gsap.to(progressBarRef.current, {
        width: '100%',
        duration: 2.2,
        ease: 'power2.inOut',
        onComplete: () => {
          // Fade out the boot screen
          gsap.to(containerRef.current, {
            opacity: 0,
            duration: 0.5,
            ease: 'power2.out',
            onComplete: () => {
              bootSystem();
            },
          });
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, [bootSystem]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 text-white select-none"
    >
      <div className="flex flex-col items-center">
        <Apple className="w-20 h-20 fill-white text-white mb-10 opacity-90 animate-pulse" />
        
        {/* Progress track */}
        <div className="w-56 h-1 bg-zinc-800 rounded-full overflow-hidden">
          {/* Progress bar */}
          <div
            ref={progressBarRef}
            className="h-full bg-zinc-300 w-0 rounded-full"
          />
        </div>
      </div>
    </div>
  );
};
