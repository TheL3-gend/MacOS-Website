import React from 'react';
import { useWindowStore } from './store/useWindowStore';
import { BootScreen } from './components/BootScreen';
import { LockScreen } from './components/LockScreen';
import { MenuBar } from './components/MenuBar';
import { Desktop } from './components/Desktop';
import { Dock } from './components/Dock';
import { WallpaperBackground } from './components/WallpaperBackground';

export const App: React.FC = () => {
  const isBooted = useWindowStore((state) => state.isBooted);
  const isLocked = useWindowStore((state) => state.isLocked);
  const isDarkMode = useWindowStore((state) => state.isDarkMode);
  const wallpaperId = useWindowStore((state) => state.wallpaperId);
  const systemBrightness = useWindowStore((state) => state.systemBrightness);

  const [renderLockScreen, setRenderLockScreen] = React.useState(isLocked);

  React.useEffect(() => {
    if (isLocked) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRenderLockScreen(true);
    }
  }, [isLocked]);

  const handleUnlockComplete = () => {
    setRenderLockScreen(false);
  };

  if (!isBooted) {
    return <BootScreen />;
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
      <WallpaperBackground wallpaperId={wallpaperId} isLocked={isLocked} />

      {/* Top Menu bar navigation */}
      <div
        className={`fixed top-0 left-0 right-0 z-30 ${
          isLocked ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        }`}
        style={{
          transition: 'transform 1s cubic-bezier(0.16, 1, 0.3, 1), opacity 1s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <MenuBar />
      </div>

      {/* Main desktop workspace */}
      <div
        className={`relative w-full h-full flex-1 overflow-hidden ${
          isLocked ? 'scale-95 opacity-0 pointer-events-none' : 'scale-100 opacity-100'
        }`}
        style={{
          transition: 'transform 1.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <Desktop />
      </div>

      {/* Dock navigation */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-30 ${
          isLocked ? 'translate-y-20 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        }`}
        style={{
          transition: 'transform 1s cubic-bezier(0.16, 1, 0.3, 1), opacity 1s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <Dock />
      </div>

      {/* Lock Screen Overlay */}
      {renderLockScreen && (
        <LockScreen onUnlockComplete={handleUnlockComplete} />
      )}

      {/* Brightness Overlay (Simulates screen dimming) */}
      <div
        className="absolute inset-0 bg-black pointer-events-none z-50 transition-opacity duration-200"
        style={{ opacity: brightnessOverlayOpacity }}
      />
    </div>
  );
};

export default App;
