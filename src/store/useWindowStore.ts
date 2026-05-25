import { create } from 'zustand';

export interface AppWindow {
  id: string;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
}

const DEFAULT_WINDOWS: Record<string, AppWindow> = {
  finder: {
    id: 'finder',
    title: 'Finder',
    isOpen: true,
    isMinimized: false,
    isMaximized: false,
    position: { x: 80, y: 80 },
    size: { width: 750, height: 480 },
    zIndex: 10,
  },
  terminal: {
    id: 'terminal',
    title: 'Terminal',
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    position: { x: 150, y: 120 },
    size: { width: 620, height: 400 },
    zIndex: 1,
  },
  safari: {
    id: 'safari',
    title: 'Safari',
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    position: { x: 120, y: 100 },
    size: { width: 850, height: 520 },
    zIndex: 1,
  },
  vscode: {
    id: 'vscode',
    title: 'VS Code',
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    position: { x: 200, y: 60 },
    size: { width: 900, height: 550 },
    zIndex: 1,
  },
  settings: {
    id: 'settings',
    title: 'System Settings',
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    position: { x: 220, y: 150 },
    size: { width: 600, height: 420 },
    zIndex: 1,
  },
  notes: {
    id: 'notes',
    title: 'Notes',
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    position: { x: 280, y: 180 },
    size: { width: 480, height: 350 },
    zIndex: 1,
  },
};

const getTopVisibleWindowId = (
  windows: Record<string, AppWindow>,
  excludedId?: string
) =>
  Object.values(windows)
    .filter((window) => window.id !== excludedId && window.isOpen && !window.isMinimized)
    .sort((a, b) => b.zIndex - a.zIndex)[0]?.id ?? null;

export interface WallpaperOption {
  id: string;
  name: string;
  type: 'gradient' | 'video';
  value: string;
}

export const WALLPAPERS: WallpaperOption[] = [
  {
    id: 'frosted-glass',
    name: 'Frosted Glass',
    type: 'video',
    value: '/backgrounds/Frosted_glass_background_video.mp4',
  },
  {
    id: 'sequoia',
    name: 'macOS Sequoia',
    type: 'gradient',
    value: 'bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-700',
  },
  {
    id: 'aurora',
    name: 'Aurora Sunset',
    type: 'gradient',
    value: 'bg-gradient-to-tr from-purple-800 via-violet-900 to-slate-900',
  },
  {
    id: 'cyber',
    name: 'Cyber Neon',
    type: 'gradient',
    value: 'bg-gradient-to-tr from-cyan-900 via-slate-950 to-fuchsia-950',
  },
  {
    id: 'minimal',
    name: 'Midnight Silk',
    type: 'gradient',
    value: 'bg-gradient-to-tr from-zinc-800 via-stone-900 to-zinc-950',
  },
];

interface SystemState {
  isBooted: boolean;
  isLocked: boolean;
  isDarkMode: boolean;
  wallpaperId: string;
  systemVolume: number;
  systemBrightness: number;
  wifiOn: boolean;
  bluetoothOn: boolean;
  activeWindow: string | null;
  windows: Record<string, AppWindow>;
  maxZIndex: number;
  
  // Actions
  bootSystem: () => void;
  unlockSystem: () => void;
  lockSystem: () => void;
  openWindow: (id: string) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  toggleMaximizeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindowPosition: (id: string, x: number, y: number) => void;
  updateWindowSize: (id: string, width: number, height: number) => void;
  setWallpaper: (wallpaperId: string) => void;
  toggleDarkMode: () => void;
  setVolume: (v: number) => void;
  setBrightness: (b: number) => void;
  toggleWifi: () => void;
  toggleBluetooth: () => void;
  shutdown: () => void;
  restart: () => void;
}

export const useWindowStore = create<SystemState>((set, get) => ({
  isBooted: false,
  isLocked: true,
  isDarkMode: true,
  wallpaperId: WALLPAPERS[0].id,
  systemVolume: 80,
  systemBrightness: 90,
  wifiOn: true,
  bluetoothOn: true,
  activeWindow: 'finder',
  windows: { ...DEFAULT_WINDOWS },
  maxZIndex: 10,

  bootSystem: () => set({ isBooted: true }),
  
  unlockSystem: () => set({ isLocked: false }),
  
  lockSystem: () => set({ isLocked: true }),
  
  openWindow: (id) => {
    const currentZ = get().maxZIndex + 1;
    set((state) => {
      const window = state.windows[id];
      if (!window) return {};
      return {
        maxZIndex: currentZ,
        activeWindow: id,
        windows: {
          ...state.windows,
          [id]: {
            ...window,
            isOpen: true,
            isMinimized: false,
            zIndex: currentZ,
          },
        },
      };
    });
  },

  closeWindow: (id) => set((state) => {
    const window = state.windows[id];
    if (!window) return {};
    const nextWindows = {
      ...state.windows,
      [id]: {
        ...window,
        isOpen: false,
        isMinimized: false,
        isMaximized: false,
      },
    };
    return {
      activeWindow: state.activeWindow === id
        ? getTopVisibleWindowId(nextWindows, id)
        : state.activeWindow,
      windows: nextWindows,
    };
  }),

  minimizeWindow: (id) => set((state) => {
    const window = state.windows[id];
    if (!window) return {};
    const nextWindows = {
      ...state.windows,
      [id]: {
        ...window,
        isMinimized: true,
      },
    };
    return {
      activeWindow: state.activeWindow === id
        ? getTopVisibleWindowId(nextWindows, id)
        : state.activeWindow,
      windows: nextWindows,
    };
  }),

  toggleMaximizeWindow: (id) => set((state) => {
    const window = state.windows[id];
    if (!window) return {};
    return {
      windows: {
        ...state.windows,
        [id]: {
          ...window,
          isMaximized: !window.isMaximized,
        },
      },
    };
  }),

  focusWindow: (id) => {
    if (get().activeWindow === id) return;
    const currentZ = get().maxZIndex + 1;
    set((state) => {
      const window = state.windows[id];
      if (!window) return {};
      return {
        maxZIndex: currentZ,
        activeWindow: id,
        windows: {
          ...state.windows,
          [id]: {
            ...window,
            zIndex: currentZ,
            isMinimized: false,
          },
        },
      };
    });
  },

  updateWindowPosition: (id, x, y) => set((state) => {
    const window = state.windows[id];
    if (!window) return {};
    return {
      windows: {
        ...state.windows,
        [id]: {
          ...window,
          position: { x, y },
        },
      },
    };
  }),

  updateWindowSize: (id, width, height) => set((state) => {
    const window = state.windows[id];
    if (!window) return {};
    return {
      windows: {
        ...state.windows,
        [id]: {
          ...window,
          size: { width, height },
        },
      },
    };
  }),

  setWallpaper: (wallpaperId) => {
    if (!WALLPAPERS.some((wallpaper) => wallpaper.id === wallpaperId)) return;
    set({ wallpaperId });
  },
  
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  
  setVolume: (v) => set({ systemVolume: Math.max(0, Math.min(100, v)) }),
  
  setBrightness: (b) => set({ systemBrightness: Math.max(10, Math.min(100, b)) }),
  
  toggleWifi: () => set((state) => ({ wifiOn: !state.wifiOn })),
  
  toggleBluetooth: () => set((state) => ({ bluetoothOn: !state.bluetoothOn })),
  
  shutdown: () => set({ isBooted: false, isLocked: true }),
  
  restart: () => set({ isBooted: false, isLocked: true }),
}));
