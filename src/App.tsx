import React from 'react';
import { useWindowStore } from './store/useWindowStore';
import { BootScreen } from './components/BootScreen';
import { LockScreen } from './components/LockScreen';
import { MenuBar } from './components/MenuBar';
import { Desktop } from './components/Desktop';
import { Dock } from './components/Dock';

export const App: React.FC = () => {
  const { isBooted, isLocked, isDarkMode, wallpaper, systemBrightness } = useWindowStore();

  if (!isBooted) {
    return <BootScreen />;
  }

  if (isLocked) {
    return <LockScreen />;
  }

  // Calculate overlay opacity for display brightness simulation
  const brightnessOverlayOpacity = (100 - systemBrightness) / 100 * 0.85;

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden flex flex-col font-sans select-none transition-colors duration-300 ${
        isDarkMode ? 'dark bg-zinc-950 text-zinc-100' : 'bg-slate-100 text-zinc-800'
      }`}
    >
      {/* Background wallpaper */}
      <div className={`absolute inset-0 -z-10 ${wallpaper} transition-all duration-700`} />

      {/* Top Menu bar navigation */}
      <MenuBar />

      {/* Main desktop workspace */}
      <Desktop />

      {/* Dock navigation */}
      <Dock />

      {/* Brightness Overlay (Simulates screen dimming) */}
      <div
        className="absolute inset-0 bg-black pointer-events-none z-50 transition-opacity duration-200"
        style={{ opacity: brightnessOverlayOpacity }}
      />
    </div>
  );
};

export default App;
