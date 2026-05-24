import React, { useState, useEffect, useRef } from 'react';
import { useWindowStore } from '../store/useWindowStore';
import { ArrowRight, Power, RefreshCw, Moon } from 'lucide-react';
import gsap from 'gsap';
import { WallpaperBackground } from './WallpaperBackground';

export const LockScreen: React.FC = () => {
  const wallpaperId = useWindowStore((state) => state.wallpaperId);
  const unlockSystem = useWindowStore((state) => state.unlockSystem);
  const shutdown = useWindowStore((state) => state.shutdown);
  const restart = useWindowStore((state) => state.restart);

  const [password, setPassword] = useState('');
  const [time, setTime] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lockRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    
    // Smooth GSAP transition to unlock
    gsap.context(() => {
      gsap.to(contentRef.current, {
        scale: 1.1,
        opacity: 0,
        duration: 0.4,
        ease: 'power2.in',
      });
      gsap.to(lockRef.current, {
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
        onComplete: () => {
          unlockSystem();
        },
      });
    }, lockRef);
  };

  const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const formattedDate = time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div
      ref={lockRef}
      className="fixed inset-0 z-40 overflow-hidden flex flex-col justify-between items-center text-white p-12 select-none"
    >
      {/* Background wallpaper with blur */}
      <WallpaperBackground wallpaperId={wallpaperId} variant="lock" />
      
      {/* Top Section: Date & Time */}
      <div ref={contentRef} className="w-full flex flex-col items-center mt-12 transition-all">
        <span className="text-sm font-semibold tracking-wider uppercase opacity-80">
          {formattedDate}
        </span>
        <h1 className="text-7xl font-extrabold tracking-tight mt-2 select-none drop-shadow-md">
          {formattedTime}
        </h1>
      </div>

      {/* Middle Section: User Login */}
      <div className="w-72 flex flex-col items-center gap-4">
        {/* Profile Avatar */}
        <div className="w-24 h-24 rounded-full border border-white/20 shadow-xl overflow-hidden flex items-center justify-center bg-white/20 backdrop-blur-md">
          <svg
            className="w-16 h-16 text-white/80"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
        
        <h2 className="text-xl font-semibold select-none drop-shadow">Guest User</h2>
        
        {/* Password input */}
        <form onSubmit={handleLogin} className="w-full flex items-center relative">
          <input
            type="password"
            placeholder="Enter password (any key)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-8 px-3 pr-10 text-xs bg-white/15 backdrop-blur-xl border border-white/25 rounded-full text-white placeholder-white/50 focus:outline-none focus:bg-white/25 focus:ring-1 focus:ring-white/40 shadow-inner"
            autoFocus
          />
          <button
            type="submit"
            className="absolute right-1 w-6 h-6 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/40 active:scale-95 transition-all text-white/80 border border-white/10"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Bottom Section: Actions */}
      <div className="flex items-center gap-10 text-xs opacity-90 drop-shadow mb-4">
        <button
          onClick={shutdown}
          className="flex flex-col items-center gap-1.5 hover:opacity-100 opacity-70 group transition-all"
        >
          <div className="w-10 h-10 rounded-full border border-white/20 bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all">
            <Power className="w-4 h-4 text-white" />
          </div>
          <span>Shut Down</span>
        </button>
        
        <button
          onClick={restart}
          className="flex flex-col items-center gap-1.5 hover:opacity-100 opacity-70 group transition-all"
        >
          <div className="w-10 h-10 rounded-full border border-white/20 bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all">
            <RefreshCw className="w-4 h-4 text-white" />
          </div>
          <span>Restart</span>
        </button>
        
        <button
          onClick={handleLogin}
          className="flex flex-col items-center gap-1.5 hover:opacity-100 opacity-70 group transition-all"
        >
          <div className="w-10 h-10 rounded-full border border-white/20 bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all">
            <Moon className="w-4 h-4 text-white" />
          </div>
          <span>Sleep</span>
        </button>
      </div>
    </div>
  );
};
