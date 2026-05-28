import React, { useState, useEffect, useRef } from 'react';
import { useWindowStore } from '../store/useWindowStore';
import { Wifi, Battery, Sliders } from 'lucide-react';
import { ControlCenter } from './ControlCenter';
import { CalendarPanel } from './CalendarPanel';

interface MenuBarProps {
  isPhoneLandscape?: boolean;
}

export const MenuBar: React.FC<MenuBarProps> = ({ isPhoneLandscape = false }) => {
  const activeAppTitle = useWindowStore((state) => {
    if (!state.activeWindow) return 'Finder';
    return state.windows[state.activeWindow]?.title || 'Finder';
  });
  const wifiOn = useWindowStore((state) => state.wifiOn);
  const lockSystem = useWindowStore((state) => state.lockSystem);
  const shutdown = useWindowStore((state) => state.shutdown);
  const restart = useWindowStore((state) => state.restart);
  const openWindow = useWindowStore((state) => state.openWindow);

  const [time, setTime] = useState(new Date());
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Dynamic live clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle click outside dropdowns to close them
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const toggleDropdown = (dropdownName: string) => {
    setActiveDropdown((prev) => (prev === dropdownName ? null : dropdownName));
  };

  const formattedTime = time.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const formattedDate = time.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  // App menus definition
  const appMenus: Record<string, string[]> = {
    Finder: ['File', 'Edit', 'View', 'Go', 'Window', 'Help'],
    Terminal: ['Shell', 'Edit', 'View', 'Window', 'Help'],
    Chrome: ['File', 'Edit', 'View', 'History', 'Bookmarks', 'Window', 'Help'],
    'VS Code': ['File', 'Edit', 'Selection', 'View', 'Go', 'Run', 'Terminal', 'Help'],
    'System Settings': ['File', 'Edit', 'View', 'Window', 'Help'],
    Notes: ['File', 'Edit', 'Format', 'View', 'Window', 'Help'],
  };

  const currentMenus = appMenus[activeAppTitle] || ['File', 'Edit', 'View', 'Window', 'Help'];

  return (
    <div
      ref={dropdownRef}
      className={`menu-bar-shell fixed top-0 left-0 right-0 h-7 text-white font-medium select-none z-30 flex items-center justify-between border-b border-white/10 ${
        isPhoneLandscape ? 'px-2 text-[11px]' : 'px-3 text-xs'
      }`}
      style={
        isPhoneLandscape
          ? {
              paddingLeft: 'max(0.5rem, env(safe-area-inset-left))',
              paddingRight: 'max(0.5rem, env(safe-area-inset-right))',
            }
          : undefined
      }
    >
      {/* Left Menu Items */}
      <div className={`flex items-center relative min-w-0 ${isPhoneLandscape ? 'gap-1.5' : 'gap-4'}`}>
        {/* Apple Logo Dropdown */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('apple')}
            className={`h-7 px-2 hover:bg-white/10 rounded flex items-center transition-all ${
              activeDropdown === 'apple' ? 'bg-white/10' : ''
            }`}
          >
            <img
              src="/leaf_logo_transparent.png"
              alt=""
              className="h-4 w-4 object-contain"
              aria-hidden="true"
            />
          </button>

          {activeDropdown === 'apple' && (
            <div className="absolute top-8 left-0 w-52 py-1 bg-zinc-900/90 dark:bg-black/75 backdrop-blur-2xl border border-white/10 rounded-lg shadow-2xl text-white z-50 text-[13px] animate-dropdown-in">
              <button
                onClick={() => {
                  openWindow('settings');
                  setActiveDropdown(null);
                }}
                className="w-full text-left px-4 py-1.5 hover:bg-indigo-600 transition-all font-normal"
              >
                About This Mac
              </button>
              <button
                onClick={() => {
                  openWindow('settings');
                  setActiveDropdown(null);
                }}
                className="w-full text-left px-4 py-1.5 hover:bg-indigo-600 transition-all font-normal"
              >
                System Settings...
              </button>
              <hr className="border-white/10 my-1" />
              <button
                onClick={() => {
                  lockSystem();
                  setActiveDropdown(null);
                }}
                className="w-full text-left px-4 py-1.5 hover:bg-indigo-600 transition-all font-normal"
              >
                Lock Screen
              </button>
              <button
                onClick={() => {
                  lockSystem();
                  setActiveDropdown(null);
                }}
                className="w-full text-left px-4 py-1.5 hover:bg-indigo-600 transition-all font-normal"
              >
                Sleep
              </button>
              <button
                onClick={() => {
                  restart();
                  setActiveDropdown(null);
                }}
                className="w-full text-left px-4 py-1.5 hover:bg-indigo-600 transition-all font-normal"
              >
                Restart...
              </button>
              <button
                onClick={() => {
                  shutdown();
                  setActiveDropdown(null);
                }}
                className="w-full text-left px-4 py-1.5 hover:bg-indigo-600 transition-all font-normal"
              >
                Shut Down...
              </button>
            </div>
          )}
        </div>

        {/* Active Application Name */}
        <span className="font-bold cursor-default px-1 truncate max-w-[9rem]">{activeAppTitle}</span>

        {/* Application Specific Menus */}
        <div className={`${isPhoneLandscape ? 'hidden' : 'hidden md:flex'} items-center gap-1`}>
          {currentMenus.map((menu) => (
            <button
              key={menu}
              onClick={() => toggleDropdown(menu.toLowerCase())}
              className={`h-7 px-2.5 hover:bg-white/10 rounded transition-all font-normal ${
                activeDropdown === menu.toLowerCase() ? 'bg-white/10' : ''
              }`}
            >
              {menu}
            </button>
          ))}
        </div>
      </div>

      {/* Right Menu Items */}
      <div className={`flex items-center relative shrink-0 ${isPhoneLandscape ? 'gap-1.5' : 'gap-3.5'}`}>
        {/* Wifi Icon */}
        <button className="opacity-80 hover:opacity-100 transition-all">
          <Wifi className={`w-3.5 h-3.5 ${wifiOn ? 'text-white' : 'text-white/40'}`} />
        </button>

        {/* Battery Icon */}
        <div className="flex items-center gap-1 opacity-80 hover:opacity-100 transition-all cursor-default">
          <span className={`text-[10px] ${isPhoneLandscape ? 'hidden' : ''}`}>100%</span>
          <Battery className="w-4 h-4 fill-white/80 text-white" />
        </div>

        {/* Control Center Toggle */}
        <div className="relative">
          <button
            type="button"
            data-testid="menu-bar-control-center"
            aria-label="Open Control Centre"
            onClick={() => toggleDropdown('controlCenter')}
            className={`h-7 px-2 hover:bg-white/10 rounded flex items-center transition-all ${
              activeDropdown === 'controlCenter' ? 'bg-white/10' : ''
            }`}
          >
            <Sliders className="w-3.5 h-3.5 rotate-90" />
          </button>

          {activeDropdown === 'controlCenter' && (
            <div className="absolute top-8 right-0 z-50">
              <ControlCenter closeCC={() => setActiveDropdown(null)} isPhoneLandscape={isPhoneLandscape} />
            </div>
          )}
        </div>

        {/* Live Date and Time */}
        <div className="relative">
          <button
            type="button"
            data-testid="menu-bar-date-time"
            aria-label="Open calendar"
            onClick={() => toggleDropdown('calendar')}
            className={`h-7 px-2 rounded flex items-center opacity-95 text-[11px] font-normal tracking-wide whitespace-nowrap hover:bg-white/10 transition-all ${
              activeDropdown === 'calendar' ? 'bg-white/10' : ''
            }`}
          >
            {isPhoneLandscape ? formattedTime : `${formattedDate} ${formattedTime}`}
          </button>

          {activeDropdown === 'calendar' && (
            <div className="absolute top-8 right-0 z-50">
              <CalendarPanel currentDate={time} isPhoneLandscape={isPhoneLandscape} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
