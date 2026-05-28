import React from 'react';
import { useWindowStore } from '../store/useWindowStore';
import {
  Wifi,
  Bluetooth,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Airplay,
  Bell,
} from 'lucide-react';

interface CCProps {
  closeCC: () => void;
  isPhoneLandscape?: boolean;
}

export const ControlCenter: React.FC<CCProps> = ({ closeCC, isPhoneLandscape = false }) => {
  const wifiOn = useWindowStore((state) => state.wifiOn);
  const bluetoothOn = useWindowStore((state) => state.bluetoothOn);
  const isDarkMode = useWindowStore((state) => state.isDarkMode);
  const systemVolume = useWindowStore((state) => state.systemVolume);
  const systemBrightness = useWindowStore((state) => state.systemBrightness);
  const toggleWifi = useWindowStore((state) => state.toggleWifi);
  const toggleBluetooth = useWindowStore((state) => state.toggleBluetooth);
  const toggleDarkMode = useWindowStore((state) => state.toggleDarkMode);
  const setVolume = useWindowStore((state) => state.setVolume);
  const setBrightness = useWindowStore((state) => state.setBrightness);
  const openWindow = useWindowStore((state) => state.openWindow);

  const handleSliderVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value));
  };

  const handleSliderBrightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBrightness(Number(e.target.value));
  };

  return (
    <div
      data-testid="control-center-panel"
      className={`rounded-2xl glass-panel-dark text-white border border-white/10 shadow-2xl flex flex-col animate-panel-in ${
        isPhoneLandscape
          ? 'w-[min(320px,calc(100vw-20px))] max-h-[calc(100dvh-48px)] overflow-y-auto p-2.5 gap-2'
          : 'w-[320px] p-3 gap-2.5'
      }`}
    >
      {/* Top Grid (Toggles & Interactive Blocks) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Left Toggle Box (Wifi / Bluetooth / AirDrop) */}
        <div className="bg-white/10 dark:bg-black/25 rounded-2xl p-2.5 flex flex-col gap-2.5 border border-white/5">
          {/* Wifi */}
          <button
            onClick={toggleWifi}
            className="flex items-center gap-2.5 w-full text-left"
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                wifiOn ? 'bg-indigo-600 text-white' : 'bg-white/10 text-white/60'
              }`}
            >
              <Wifi className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold leading-tight">Wi-Fi</span>
              <span className="text-[9px] opacity-60 leading-none">
                {wifiOn ? 'Home-5G' : 'Off'}
              </span>
            </div>
          </button>

          {/* Bluetooth */}
          <button
            onClick={toggleBluetooth}
            className="flex items-center gap-2.5 w-full text-left"
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                bluetoothOn ? 'bg-indigo-600 text-white' : 'bg-white/10 text-white/60'
              }`}
            >
              <Bluetooth className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold leading-tight">Bluetooth</span>
              <span className="text-[9px] opacity-60 leading-none">
                {bluetoothOn ? 'On' : 'Off'}
              </span>
            </div>
          </button>
        </div>

        {/* Right Quick Toggles Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Dark Mode */}
          <button
            onClick={toggleDarkMode}
            className="bg-white/10 dark:bg-black/25 rounded-2xl p-2 flex flex-col items-center justify-center gap-1 border border-white/5 hover:bg-white/15 transition-all text-center"
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                isDarkMode ? 'text-amber-400 bg-amber-400/10' : 'text-zinc-300'
              }`}
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </div>
            <span className="text-[9px] font-semibold">
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>

          {/* Do Not Disturb */}
          <button className="bg-white/10 dark:bg-black/25 rounded-2xl p-2 flex flex-col items-center justify-center gap-1 border border-white/5 hover:bg-white/15 transition-all text-center">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-300">
              <Bell className="w-3.5 h-3.5" />
            </div>
            <span className="text-[9px] font-semibold">DND</span>
          </button>
        </div>
      </div>

      {/* Sliders Area (Volume & Brightness) */}
      <div className="bg-white/10 dark:bg-black/25 rounded-2xl p-3 flex flex-col gap-3 border border-white/5">
        {/* Brightness Slider */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[10px] opacity-75 font-semibold">
            <span>Display</span>
            <span>{systemBrightness}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Sun className="w-3.5 h-3.5 opacity-60" />
            <input
              type="range"
              min="10"
              max="100"
              value={systemBrightness}
              onChange={handleSliderBrightnessChange}
              className="w-full h-4 rounded-lg bg-zinc-800 accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Volume Slider */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[10px] opacity-75 font-semibold">
            <span>Sound</span>
            <span>{systemVolume}%</span>
          </div>
          <div className="flex items-center gap-2">
            {systemVolume === 0 ? (
              <VolumeX className="w-3.5 h-3.5 opacity-60" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 opacity-60" />
            )}
            <input
              type="range"
              min="0"
              max="100"
              value={systemVolume}
              onChange={handleSliderVolumeChange}
              className="w-full h-4 rounded-lg bg-zinc-800 accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Music / Playing Info Card */}
      <div className="bg-white/10 dark:bg-black/25 rounded-2xl p-2.5 flex items-center gap-3 border border-white/5">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-md">
          <Airplay className="w-4 h-4 text-white" />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-[10px] font-bold truncate leading-tight">Now Playing</span>
          <span className="text-[8px] opacity-60 truncate leading-none mt-0.5">
            MacBook Pro Speakers
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* Mock mini wave */}
          <div className="flex items-end gap-0.5 h-4">
            <div className="w-0.5 bg-indigo-500 rounded-full h-2 animate-pulse" />
            <div className="w-0.5 bg-indigo-500 rounded-full h-4 animate-pulse duration-700" />
            <div className="w-0.5 bg-indigo-500 rounded-full h-3 animate-pulse duration-500" />
            <div className="w-0.5 bg-indigo-500 rounded-full h-1" />
          </div>
        </div>
      </div>

      {/* System Settings Shortcut Button */}
      <button
        onClick={() => {
          openWindow('settings');
          closeCC();
        }}
        className="w-full text-center py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-98 text-[10px] font-bold tracking-wide border border-white/5 transition-all text-white/90"
      >
        Open System Settings...
      </button>
    </div>
  );
};
