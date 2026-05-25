import React, { useMemo, useRef } from 'react';
import { useWindowStore } from '../store/useWindowStore';
import { Terminal, Compass, Settings, FileText, Code2, FolderOpen } from 'lucide-react';

interface DockItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  bgClass: string;
}

interface DockProps {
  isPhoneLandscape?: boolean;
}

// Define dock icons with macOS-style squircle gradients and layouts.
const DOCK_ITEMS: DockItem[] = [
  {
    id: 'finder',
    name: 'Finder',
    bgClass: 'bg-gradient-to-b from-sky-400 to-blue-600 border border-blue-400/40 shadow-[0_4px_12px_rgba(2,132,199,0.3)]',
    icon: (
      <div className="relative w-full h-full flex items-center justify-center text-white">
        <FolderOpen className="w-6 h-6 drop-shadow-md" />
      </div>
    ),
  },
  {
    id: 'terminal',
    name: 'Terminal',
    bgClass: 'bg-gradient-to-b from-zinc-800 to-zinc-950 border border-zinc-700/50 shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
    icon: (
      <div className="w-full h-full flex items-center justify-center text-green-400 font-bold font-mono text-[18px]">
        <Terminal className="w-6 h-6 text-green-400 drop-shadow-[0_0_2px_rgba(74,222,128,0.5)]" />
      </div>
    ),
  },
  {
    id: 'safari',
    name: 'Safari',
    bgClass: 'bg-gradient-to-b from-sky-100 to-slate-200 border border-sky-300 shadow-[0_4px_12px_rgba(56,189,248,0.2)]',
    icon: (
      <div className="w-full h-full flex items-center justify-center text-sky-600">
        <Compass className="w-6.5 h-6.5 stroke-[1.5] drop-shadow-sm" />
      </div>
    ),
  },
  {
    id: 'vscode',
    name: 'VS Code',
    bgClass: 'bg-gradient-to-b from-indigo-950 to-indigo-900 border border-indigo-700/50 shadow-[0_4px_12px_rgba(99,102,241,0.2)]',
    icon: (
      <div className="w-full h-full flex items-center justify-center text-sky-400">
        <Code2 className="w-6 h-6 drop-shadow-md" />
      </div>
    ),
  },
  {
    id: 'notes',
    name: 'Notes',
    bgClass: 'bg-gradient-to-b from-amber-300 to-amber-400 border border-amber-300/50 shadow-[0_4px_12px_rgba(251,191,36,0.3)]',
    icon: (
      <div className="w-full h-full flex flex-col justify-between text-amber-950 px-1 py-1.5">
        {/* Mock lines on notepad */}
        <div className="h-0.5 w-full bg-amber-950/20" />
        <FileText className="w-5 h-5 mx-auto opacity-80" />
        <div className="h-0.5 w-full bg-amber-950/20" />
      </div>
    ),
  },
  {
    id: 'settings',
    name: 'System Settings',
    bgClass: 'bg-gradient-to-b from-slate-400 to-slate-600 border border-slate-400/40 shadow-[0_4px_12px_rgba(71,85,105,0.3)]',
    icon: (
      <div className="w-full h-full flex items-center justify-center text-white">
        <Settings className="w-6 h-6 drop-shadow-md animate-spin-slow" />
      </div>
    ),
  },
];

export const Dock: React.FC<DockProps> = ({ isPhoneLandscape = false }) => {
  const openWindow = useWindowStore((state) => state.openWindow);
  const focusWindow = useWindowStore((state) => state.focusWindow);
  const windowIndicatorSignature = useWindowStore((state) =>
    DOCK_ITEMS.map((item) => {
      const win = state.windows[item.id];
      if (!win?.isOpen) return '';

      return `${item.id}:${win.isMinimized ? 'minimized' : 'open'}`;
    })
      .filter(Boolean)
      .join('|')
  );
  const windowIndicators = useMemo(
    () =>
      new Map(
        windowIndicatorSignature
          .split('|')
          .filter(Boolean)
          .map((entry) => {
            const [appId, status] = entry.split(':');
            return [appId, status];
          })
      ),
    [windowIndicatorSignature]
  );
  const dockRef = useRef<HTMLDivElement>(null);

  const handleIconClick = (id: string) => {
    openWindow(id);
    focusWindow(id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPhoneLandscape) return;
    if (!dockRef.current) return;
    const dock = dockRef.current;
    const children = dock.querySelectorAll<HTMLElement>('.dock-item-container');
    
    children.forEach((child) => {
      const rect = child.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const distance = Math.abs(e.clientX - center);
      
      // Hover effect distance
      const maxDistance = 60;
      let scale = 1;
      
      if (distance < maxDistance) {
        // Calculate dynamic scale factor up to 1.5
        const factor = 1 - distance / maxDistance; // 0 to 1
        scale = 1 + factor * 0.45;
      }
      
      const icon = child.querySelector<HTMLElement>('.dock-icon-wrap');
      if (icon) {
        icon.style.transform = `scale(${scale})`;
        icon.style.transformOrigin = 'bottom center';
        // Add elevation/lift proportional to scale
        const translateY = -(scale - 1) * 15;
        icon.style.marginTop = `${translateY}px`;
      }
    });
  };

  const handleMouseLeave = () => {
    if (isPhoneLandscape) return;
    if (!dockRef.current) return;
    const children = dockRef.current.querySelectorAll<HTMLElement>('.dock-item-container');
    
    children.forEach((child) => {
      const icon = child.querySelector<HTMLElement>('.dock-icon-wrap');
      if (icon) {
        icon.style.transform = 'scale(1)';
        icon.style.marginTop = '0px';
      }
    });
  };

  return (
    <div
      className={`flex justify-center pointer-events-none select-none ${isPhoneLandscape ? 'pb-1' : 'pb-3'}`}
      style={isPhoneLandscape ? { paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' } : undefined}
    >
      <div
        ref={dockRef}
        onMouseMove={isPhoneLandscape ? undefined : handleMouseMove}
        onMouseLeave={isPhoneLandscape ? undefined : handleMouseLeave}
        className={`pointer-events-auto flex items-end glass border border-white/20 shadow-2xl relative transition-all ${
          isPhoneLandscape ? 'gap-2 px-3 py-2 rounded-[20px]' : 'gap-3 px-4 py-2.5 rounded-[24px]'
        }`}
        style={{ height: isPhoneLandscape ? '58px' : '70px' }}
      >
        {DOCK_ITEMS.map((item) => {
          const windowIndicator = windowIndicators.get(item.id);
          const isOpen = Boolean(windowIndicator);
          const isMinimized = windowIndicator === 'minimized';
          
          return (
            <div
              key={item.id}
              data-dock-app-id={item.id}
              onClick={() => handleIconClick(item.id)}
              className="dock-item-container flex flex-col items-center justify-end relative cursor-pointer pb-1 group"
              style={{ width: isPhoneLandscape ? '40px' : '48px', height: '100%' }}
            >
              {/* Tooltip */}
              <div className={`absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-zinc-900/90 dark:bg-black/80 backdrop-blur border border-white/10 rounded-md text-[10px] text-white font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md ${
                isPhoneLandscape ? 'hidden' : ''
              }`}>
                {item.name}
              </div>

              {/* Icon squircle frame */}
              <div
                className={`dock-icon-wrap ${isPhoneLandscape ? 'w-10 h-10 rounded-xl' : 'w-12 h-12 rounded-[13px]'} flex items-center justify-center select-none shadow-md transform transition-all ${item.bgClass}`}
                style={{ transition: 'margin-top 0.1s ease-out, transform 0.05s ease-out' }}
              >
                {item.icon}
              </div>

              {/* Running App Indicator Dot */}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex items-center justify-center h-1.5 w-3">
                {isOpen && (
                  <div
                    className={`h-1.5 rounded-full bg-white dark:bg-zinc-300 shadow-[0_0_4px_white] transition-all duration-200 ${
                      isMinimized ? 'w-3' : 'w-1.5'
                    }`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
