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
  const bootSystem = useWindowStore((state) => state.bootSystem);
  const isDockHiddenForFullscreen = useWindowStore((state) => {
    const activeWindow = state.activeWindow ? state.windows[state.activeWindow] : null;
    return Boolean(activeWindow?.isOpen && !activeWindow.isMinimized && activeWindow.isMaximized);
  });

  const [renderLockScreen, setRenderLockScreen] = React.useState(isLocked);
  const [isThemeTransitioning, setIsThemeTransitioning] = React.useState(false);
  const hasObservedThemeRef = React.useRef(false);
  const isUnlocking = renderLockScreen && !isLocked;
  const unlockRevealDelay = isUnlocking ? '0.45s' : '0s';
  const dockIsHidden = isLocked || isDockHiddenForFullscreen;
  const dockTranslateY = dockIsHidden ? 'calc(100% + 20px)' : '0px';

  React.useEffect(() => {
    if (!hasObservedThemeRef.current) {
      hasObservedThemeRef.current = true;
      return;
    }

    setIsThemeTransitioning(true);
    const transitionTimeout = window.setTimeout(() => {
      setIsThemeTransitioning(false);
    }, 940);

    return () => {
      window.clearTimeout(transitionTimeout);
    };
  }, [isDarkMode]);

  React.useEffect(() => {
    if (isLocked) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRenderLockScreen(true);
    }
  }, [isLocked]);

  const handleUnlockComplete = () => {
    setRenderLockScreen(false);
  };

  // Calculate overlay opacity for display brightness simulation
  const brightnessOverlayOpacity = (100 - systemBrightness) / 100 * 0.85;

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden flex flex-col font-sans select-none transition-colors duration-300 ${
        isDarkMode ? 'dark bg-zinc-950 text-zinc-100' : 'bg-slate-100 text-zinc-800'
      } ${isThemeTransitioning ? 'theme-transitioning' : ''}`}
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
          transitionDelay: unlockRevealDelay,
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
          transitionDelay: unlockRevealDelay,
        }}
      >
        <Desktop />
      </div>

      {/* Dock navigation */}
      <div
        className={`fixed bottom-0 left-0 right-0 ${
          isLocked
            ? 'opacity-0 pointer-events-none'
            : isDockHiddenForFullscreen
              ? 'opacity-100 pointer-events-none'
              : 'opacity-100'
        }`}
        style={{
          zIndex: 2147483647,
          transform: `translate3d(0, ${dockTranslateY}, 0)`,
          transition: 'transform 1.1s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          transitionDelay: unlockRevealDelay,
          willChange: 'transform',
        }}
      >
        <Dock />
      </div>

      {/* Lock Screen Overlay */}
      {renderLockScreen && (
        <LockScreen onUnlockComplete={handleUnlockComplete} />
      )}

      {/* Boot Screen Overlay */}
      {!isBooted && (
        <BootScreen onBootComplete={bootSystem} />
      )}

      {/* Theme transition wash */}
      {isThemeTransitioning && (
        <div
          className={`theme-switch-wash ${
            isDarkMode ? 'theme-switch-wash-dark' : 'theme-switch-wash-light'
          }`}
        />
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
