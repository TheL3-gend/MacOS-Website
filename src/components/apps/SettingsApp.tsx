import React, { useEffect, useState } from 'react';
import { useWindowStore, WALLPAPERS } from '../../store/useWindowStore';
import { Wifi, Bluetooth, Sun, Moon, Laptop } from 'lucide-react';

type UserAgentBrand = {
  brand: string;
  version: string;
};

type UserAgentHighEntropyValues = {
  architecture?: string;
  bitness?: string;
  model?: string;
  platform?: string;
  platformVersion?: string;
  fullVersionList?: UserAgentBrand[];
};

type NavigatorUserAgentData = {
  brands?: UserAgentBrand[];
  mobile?: boolean;
  platform?: string;
  getHighEntropyValues?: (hints: string[]) => Promise<UserAgentHighEntropyValues>;
};

type HardwareNavigator = Navigator & {
  deviceMemory?: number;
  userAgentData?: NavigatorUserAgentData;
};

type HardwareInfo = {
  deviceName: string;
  summary: string;
  processor: string;
  graphics: string;
  memory: string;
  operatingSystem: string;
  serialNumber: string;
};

const unavailable = 'Unavailable in browser';

const initialHardwareInfo: HardwareInfo = {
  deviceName: 'This Device',
  summary: 'Detecting hardware...',
  processor: 'Detecting...',
  graphics: 'Detecting...',
  memory: 'Detecting...',
  operatingSystem: 'Detecting...',
  serialNumber: unavailable,
};

const getWindowsName = (version: string): string => {
  const major = Number(version.split('.')[0]);

  if (major >= 13) {
    return 'Windows 11';
  }

  if (major > 0) {
    return 'Windows 10';
  }

  return 'Windows';
};

const getOperatingSystemFromUserAgent = (userAgent: string): string => {
  const windowsMatch = userAgent.match(/Windows NT ([\d.]+)/);
  if (windowsMatch) {
    return 'Windows';
  }

  const macMatch = userAgent.match(/Mac OS X ([\d_]+)/);
  if (macMatch?.[1]) {
    return `macOS ${macMatch[1].replaceAll('_', '.')}`;
  }

  const androidMatch = userAgent.match(/Android ([\d.]+)/);
  if (androidMatch?.[1]) {
    return `Android ${androidMatch[1]}`;
  }

  if (/iPhone|iPad|iPod/.test(userAgent)) {
    return 'iOS';
  }

  if (/Linux/.test(userAgent)) {
    return 'Linux';
  }

  return unavailable;
};

const normalizePlatformName = (platform: string | undefined, userAgent: string): string => {
  const value = platform?.toLowerCase() ?? '';

  if (value.includes('win')) {
    return 'Windows';
  }

  if (value.includes('mac')) {
    return 'macOS';
  }

  if (value.includes('android')) {
    return 'Android';
  }

  if (value.includes('iphone') || value.includes('ipad') || value.includes('ios')) {
    return 'iOS';
  }

  if (value.includes('linux')) {
    return 'Linux';
  }

  if (platform) {
    return platform;
  }

  return getOperatingSystemFromUserAgent(userAgent);
};

const getOperatingSystem = (
  platform: string | undefined,
  platformVersion: string | undefined,
  userAgent: string,
): string => {
  const normalizedPlatform = normalizePlatformName(platform, userAgent);

  if (normalizedPlatform === 'Windows' && platformVersion && platformVersion !== '0.0.0') {
    return getWindowsName(platformVersion);
  }

  if (platformVersion && platformVersion !== '0.0.0' && normalizedPlatform !== unavailable) {
    return `${normalizedPlatform} ${platformVersion}`;
  }

  if (normalizedPlatform !== unavailable) {
    return normalizedPlatform;
  }

  return getOperatingSystemFromUserAgent(userAgent);
};

const getDeviceName = (operatingSystem: string, model: string | undefined, isMobile: boolean): string => {
  if (model) {
    return model;
  }

  if (operatingSystem.startsWith('Windows')) {
    return 'Windows PC';
  }

  if (operatingSystem.startsWith('macOS')) {
    return 'Mac';
  }

  if (operatingSystem.startsWith('Linux')) {
    return 'Linux PC';
  }

  if (operatingSystem.startsWith('Android')) {
    return 'Android Device';
  }

  if (operatingSystem.startsWith('iOS')) {
    return isMobile ? 'iPhone or iPad' : 'iOS Device';
  }

  return 'This Device';
};

const getProcessor = (navigatorInfo: HardwareNavigator, architecture: string | undefined, bitness: string | undefined): string => {
  const cpuCores = navigatorInfo.hardwareConcurrency
    ? `${navigatorInfo.hardwareConcurrency} logical CPU cores`
    : '';
  const cpuArchitecture = architecture
    ? `${architecture}${bitness ? ` ${bitness}-bit` : ''}`
    : '';

  return [cpuArchitecture, cpuCores].filter(Boolean).join(' | ') || unavailable;
};

const getMemory = (navigatorInfo: HardwareNavigator): string => {
  if (!navigatorInfo.deviceMemory) {
    return unavailable;
  }

  return `${navigatorInfo.deviceMemory} GB RAM (approx.)`;
};

const getGraphics = (): string => {
  const canvas = document.createElement('canvas');
  const gl =
    canvas.getContext('webgl') ??
    (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);

  if (!gl) {
    return unavailable;
  }

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = debugInfo
    ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
    : gl.getParameter(gl.RENDERER);

  return typeof renderer === 'string' && renderer.trim() ? renderer.trim() : unavailable;
};

const getHardwareInfo = async (): Promise<HardwareInfo> => {
  const navigatorInfo = window.navigator as HardwareNavigator;
  const userAgent = navigatorInfo.userAgent;
  const userAgentData = navigatorInfo.userAgentData;
  let hints: UserAgentHighEntropyValues = {};

  if (userAgentData?.getHighEntropyValues) {
    try {
      hints = await userAgentData.getHighEntropyValues([
        'architecture',
        'bitness',
        'model',
        'platform',
        'platformVersion',
        'fullVersionList',
      ]);
    } catch {
      hints = {};
    }
  }

  const operatingSystem = getOperatingSystem(
    hints.platform ?? userAgentData?.platform ?? navigatorInfo.platform,
    hints.platformVersion,
    userAgent,
  );
  const processor = getProcessor(navigatorInfo, hints.architecture, hints.bitness);
  const memory = getMemory(navigatorInfo);

  return {
    deviceName: getDeviceName(operatingSystem, hints.model, Boolean(userAgentData?.mobile)),
    summary: [processor, memory].filter((value) => value !== unavailable).join(' | ') || 'Hardware access limited',
    processor,
    graphics: getGraphics(),
    memory,
    operatingSystem,
    serialNumber: unavailable,
  };
};

export const SettingsApp: React.FC = () => {
  const wallpaperId = useWindowStore((state) => state.wallpaperId);
  const isDarkMode = useWindowStore((state) => state.isDarkMode);
  const systemVolume = useWindowStore((state) => state.systemVolume);
  const systemBrightness = useWindowStore((state) => state.systemBrightness);
  const wifiOn = useWindowStore((state) => state.wifiOn);
  const bluetoothOn = useWindowStore((state) => state.bluetoothOn);
  const setWallpaper = useWindowStore((state) => state.setWallpaper);
  const toggleDarkMode = useWindowStore((state) => state.toggleDarkMode);
  const setVolume = useWindowStore((state) => state.setVolume);
  const setBrightness = useWindowStore((state) => state.setBrightness);
  const toggleWifi = useWindowStore((state) => state.toggleWifi);
  const toggleBluetooth = useWindowStore((state) => state.toggleBluetooth);
  const [hardwareInfo, setHardwareInfo] = useState<HardwareInfo>(initialHardwareInfo);

  useEffect(() => {
    let isMounted = true;

    getHardwareInfo().then((info) => {
      if (isMounted) {
        setHardwareInfo(info);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex h-full w-full bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 select-none text-xs">
      {/* Settings Sidebar */}
      <div className="w-44 border-r border-slate-200 dark:border-zinc-800 bg-slate-100/50 dark:bg-zinc-900/30 p-2.5 flex flex-col gap-1 shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-slate-200/80 dark:bg-zinc-800/80 text-blue-600 dark:text-sky-400 font-semibold w-full text-left">
          <Laptop className="w-4 h-4 text-sky-500" />
          <span>System Settings</span>
        </div>
      </div>

      {/* Settings Details Pane */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
        
        {/* About This Mac section */}
        <div className="bg-slate-200/35 dark:bg-zinc-900/20 border border-slate-200/50 dark:border-zinc-800/50 rounded-xl p-4 flex flex-col sm:flex-row gap-5 items-center">
          {/* Apple Mac computer graphic vector SVG */}
          <div className="w-20 h-20 bg-gradient-to-b from-slate-200 to-slate-400 dark:from-zinc-700 dark:to-zinc-800 rounded-xl flex items-center justify-center shadow-md relative shrink-0">
            <svg
              className="w-12 h-12 text-slate-500 dark:text-zinc-400"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M4 6h16v10H4zm8 12c-1.1 0-2-.9-2-2h4c0 1.1-.9 2-2 2zm6 2H6v-1h12z" />
            </svg>
          </div>

          <div className="flex-1 flex flex-col text-center sm:text-left gap-1">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">{hardwareInfo.deviceName}</h2>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium break-words">{hardwareInfo.summary}</p>
            <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-4 gap-y-1.5 mt-2 border-t border-slate-200 dark:border-zinc-800 pt-2 text-[10px] opacity-80">
              <span className="font-semibold text-right sm:text-left">Processor:</span>
              <span className="min-w-0 break-words">{hardwareInfo.processor}</span>
              <span className="font-semibold text-right sm:text-left">Graphics:</span>
              <span className="min-w-0 break-words">{hardwareInfo.graphics}</span>
              <span className="font-semibold text-right sm:text-left">Memory:</span>
              <span className="min-w-0 break-words">{hardwareInfo.memory}</span>
              <span className="font-semibold text-right sm:text-left">Operating System:</span>
              <span className="min-w-0 break-words">{hardwareInfo.operatingSystem}</span>
              <span className="font-semibold text-right sm:text-left">Serial Number:</span>
              <span className="min-w-0 break-words font-mono">{hardwareInfo.serialNumber}</span>
            </div>
          </div>
        </div>

        {/* Wallpaper Customizer Section */}
        <div className="flex flex-col gap-2.5">
          <h3 className="font-bold text-slate-900 dark:text-white text-xs">Desktop Wallpapers</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {WALLPAPERS.map((wp) => (
              <button
                type="button"
                key={wp.id}
                onClick={() => setWallpaper(wp.id)}
                className={`flex flex-col gap-1.5 p-1.5 rounded-xl border transition-all ${
                  wallpaperId === wp.id
                    ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20'
                    : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-200/30 dark:hover:bg-zinc-800/30'
                }`}
              >
                {/* Wallpaper thumbnail representation */}
                {wp.type === 'video' ? (
                  <div className="relative w-full h-16 overflow-hidden rounded-lg bg-zinc-950 shadow-inner">
                    <video
                      src={wp.value}
                      className="h-full w-full object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      aria-hidden="true"
                    />
                    <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                  </div>
                ) : (
                  <div className={`w-full h-16 rounded-lg ${wp.value} shadow-inner`} />
                )}
                <span className="text-[10px] font-semibold text-center w-full block mt-0.5">{wp.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Toggles & Sliders Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Hardware status triggers */}
          <div className="bg-slate-200/20 dark:bg-zinc-900/10 border border-slate-200/50 dark:border-zinc-800/50 rounded-xl p-3.5 flex flex-col gap-3">
            <h4 className="font-bold text-slate-900 dark:text-white">Hardware Toggles</h4>
            
            {/* Wifi Toggle */}
            <div className="flex items-center justify-between">
              <span className="font-medium flex items-center gap-2">
                <Wifi className="w-3.5 h-3.5 text-blue-500" /> Wi-Fi Network
              </span>
              <input
                type="checkbox"
                checked={wifiOn}
                onChange={toggleWifi}
                className="w-8 h-4 bg-zinc-300 rounded-full appearance-none checked:bg-blue-500 transition-colors cursor-pointer relative after:content-[''] after:absolute after:w-3.5 after:h-3.5 after:bg-white after:rounded-full after:left-0.5 after:top-0.5 checked:after:translate-x-3.5 after:transition-transform"
              />
            </div>

            {/* Bluetooth Toggle */}
            <div className="flex items-center justify-between border-t border-slate-200 dark:border-zinc-800/50 pt-2.5">
              <span className="font-medium flex items-center gap-2">
                <Bluetooth className="w-3.5 h-3.5 text-blue-500" /> Bluetooth Link
              </span>
              <input
                type="checkbox"
                checked={bluetoothOn}
                onChange={toggleBluetooth}
                className="w-8 h-4 bg-zinc-300 rounded-full appearance-none checked:bg-blue-500 transition-colors cursor-pointer relative after:content-[''] after:absolute after:w-3.5 after:h-3.5 after:bg-white after:rounded-full after:left-0.5 after:top-0.5 checked:after:translate-x-3.5 after:transition-transform"
              />
            </div>

            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between border-t border-slate-200 dark:border-zinc-800/50 pt-2.5">
              <span className="font-medium flex items-center gap-2">
                {isDarkMode ? <Moon className="w-3.5 h-3.5 text-amber-500" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />} Dark Mode UI
              </span>
              <input
                type="checkbox"
                checked={isDarkMode}
                onChange={toggleDarkMode}
                className="w-8 h-4 bg-zinc-300 rounded-full appearance-none checked:bg-blue-500 transition-colors cursor-pointer relative after:content-[''] after:absolute after:w-3.5 after:h-3.5 after:bg-white after:rounded-full after:left-0.5 after:top-0.5 checked:after:translate-x-3.5 after:transition-transform"
              />
            </div>
          </div>

          {/* Volume & Brightness sliders */}
          <div className="bg-slate-200/20 dark:bg-zinc-900/10 border border-slate-200/50 dark:border-zinc-800/50 rounded-xl p-3.5 flex flex-col gap-3">
            <h4 className="font-bold text-slate-900 dark:text-white">Adjust System Audio & Display</h4>

            {/* Brightness */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between font-semibold">
                <span>Screen Brightness</span>
                <span>{systemBrightness}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={systemBrightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full h-3 bg-zinc-300 dark:bg-zinc-800 rounded-lg cursor-pointer accent-blue-500"
              />
            </div>

            {/* Sound */}
            <div className="flex flex-col gap-1.5 border-t border-slate-200 dark:border-zinc-800/50 pt-2.5">
              <div className="flex justify-between font-semibold">
                <span>Sound Level Volume</span>
                <span>{systemVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={systemVolume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full h-3 bg-zinc-300 dark:bg-zinc-800 rounded-lg cursor-pointer accent-blue-500"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
