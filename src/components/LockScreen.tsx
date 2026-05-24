import React, { useState, useEffect, useRef } from 'react';
import { useWindowStore } from '../store/useWindowStore';
import { ArrowRight, Power, RefreshCw, Moon } from 'lucide-react';

interface LockScreenProps {
  onUnlockComplete: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlockComplete }) => {
  const unlockSystem = useWindowStore((state) => state.unlockSystem);
  const shutdown = useWindowStore((state) => state.shutdown);
  const restart = useWindowStore((state) => state.restart);
  const isLocked = useWindowStore((state) => state.isLocked);

  const [password, setPassword] = useState('');
  const [time, setTime] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const unlockDelayRef = useRef<number | null>(null);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isLocked) return;

    const frame = window.requestAnimationFrame(() => setHasEntered(true));
    return () => window.cancelAnimationFrame(frame);
  }, [isLocked]);

  useEffect(() => {
    return () => {
      if (unlockDelayRef.current !== null) {
        window.clearTimeout(unlockDelayRef.current);
      }
    };
  }, []);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting || !isLocked) return;

    setIsSubmitting(true);
    unlockDelayRef.current = window.setTimeout(() => {
      unlockDelayRef.current = null;
      unlockSystem();
    }, 180);
  };

  const handleTransitionEnd = (event: React.TransitionEvent<HTMLDivElement>) => {
    if (isLocked || event.target !== event.currentTarget || event.propertyName !== 'transform') return;

    setIsSubmitting(false);
    onUnlockComplete();
  };

  const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const formattedDate = time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  const contentTransform = isLocked
    ? hasEntered
      ? 'translateY(0) scale(1)'
      : 'translateY(8px) scale(0.96)'
    : 'translateY(-96px) scale(1.04)';
  const lockScreenStyle: React.CSSProperties = {
    opacity: isLocked && hasEntered ? 1 : 0,
    transform: isLocked ? 'translateY(0)' : 'translateY(-108%)',
    transition:
      'transform 1.1s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.8s cubic-bezier(0.32, 0.72, 0, 1)',
    willChange: 'transform, opacity',
  };
  const contentStyle: React.CSSProperties = {
    opacity: isLocked && hasEntered ? 1 : 0,
    transform: contentTransform,
    transition:
      'transform 0.6s cubic-bezier(0.55, 0.085, 0.68, 0.53), opacity 0.6s cubic-bezier(0.55, 0.085, 0.68, 0.53)',
    willChange: 'transform, opacity',
  };

  return (
    <div
      className="fixed inset-0 z-40 overflow-hidden flex flex-col justify-between items-center text-white p-12 select-none"
      style={lockScreenStyle}
      onTransitionEnd={handleTransitionEnd}
    >
      
      {/* Top Section: Date & Time */}
      <div className="w-full flex flex-col items-center mt-12" style={contentStyle}>
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
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            aria-label="Unlock"
            className="absolute right-1 w-6 h-6 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/40 active:scale-95 transition-all text-white/80 border border-white/10 disabled:opacity-50 disabled:pointer-events-none"
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
