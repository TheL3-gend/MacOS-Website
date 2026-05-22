import React, { useState, useEffect, useRef } from 'react';
import { useWindowStore } from '../store/useWindowStore';
import { Apple, Wifi, Battery, Sliders } from 'lucide-react';
import { ControlCenter } from './ControlCenter';

export const MenuBar: React.FC = () => {
  const {
    activeWindow,
    windows,
    wifiOn,
    lockSystem,
    shutdown,
    restart,
    openWindow,
  } = useWindowStore();

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

  const getActiveAppTitle = () => {
    if (!activeWindow) return 'Finder';
    return windows[activeWindow]?.title || 'Finder';
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
    Safari: ['File', 'Edit', 'View', 'History', 'Bookmarks', 'Window', 'Help'],
    'VS Code': ['File', 'Edit', 'Selection', 'View', 'Go', 'Run', 'Terminal', 'Help'],
    'System Settings': ['File', 'Edit', 'View', 'Window', 'Help'],
    Notes: ['File', 'Edit', 'Format', 'View', 'Window', 'Help'],
  };

  const currentMenus = appMenus[getActiveAppTitle()] || ['File', 'Edit', 'View', 'Window', 'Help'];

  return (
    <div
      ref={dropdownRef}
      className="fixed top-0 left-0 right-0 h-7 text-white font-medium select-none z-30 flex items-center justify-between px-3 text-xs bg-black/10 dark:bg-black/25 backdrop-blur-md border-b border-white/10"
    >
      {/* Left Menu Items */}
      <div className="flex items-center gap-4 relative">
        {/* Apple Logo Dropdown */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('apple')}
            className={`h-7 px-2 hover:bg-white/10 rounded flex items-center transition-all ${
              activeDropdown === 'apple' ? 'bg-white/10' : ''
            }`}
          >
            <Apple className="w-3.5 h-3.5 fill-white text-white" />
          </button>

          {activeDropdown === 'apple' && (
            <div className="absolute top-8 left-0 w-52 py-1 bg-zinc-900/90 dark:bg-black/75 backdrop-blur-2xl border border-white/10 rounded-lg shadow-2xl text-white z-50 text-[13px] animate-in fade-in zoom-in-95 duration-100">
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
        <span className="font-bold cursor-default px-1">{getActiveAppTitle()}</span>

        {/* Application Specific Menus */}
        <div className="hidden md:flex items-center gap-1">
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
      <div className="flex items-center gap-3.5 relative">
        {/* Wifi Icon */}
        <button className="opacity-80 hover:opacity-100 transition-all">
          <Wifi className={`w-3.5 h-3.5 ${wifiOn ? 'text-white' : 'text-white/40'}`} />
        </button>

        {/* Battery Icon */}
        <div className="flex items-center gap-1 opacity-80 hover:opacity-100 transition-all cursor-default">
          <span className="text-[10px]">100%</span>
          <Battery className="w-4 h-4 fill-white/80 text-white" />
        </div>

        {/* Control Center Toggle */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('controlCenter')}
            className={`h-7 px-2 hover:bg-white/10 rounded flex items-center transition-all ${
              activeDropdown === 'controlCenter' ? 'bg-white/10' : ''
            }`}
          >
            <Sliders className="w-3.5 h-3.5 rotate-90" />
          </button>

          {activeDropdown === 'controlCenter' && (
            <div className="absolute top-8 right-0 z-50">
              <ControlCenter closeCC={() => setActiveDropdown(null)} />
            </div>
          )}
        </div>

        {/* Live Date and Time */}
        <span className="opacity-95 text-[11px] cursor-default font-normal tracking-wide pl-1">
          {formattedDate} {formattedTime}
        </span>
      </div>
    </div>
  );
};
