import React from 'react';
import { WALLPAPERS } from '../store/useWindowStore';

interface WallpaperBackgroundProps {
  wallpaperId: string;
  isLocked?: boolean;
}

export const WallpaperBackground: React.FC<WallpaperBackgroundProps> = ({
  wallpaperId,
  isLocked = false,
}) => {
  const wallpaper = WALLPAPERS.find((option) => option.id === wallpaperId) ?? WALLPAPERS[0];
  const wallpaperStyle: React.CSSProperties = {
    filter: isLocked ? 'blur(24px) brightness(0.65) saturate(1.6)' : 'blur(0px) brightness(1) saturate(1)',
    transform: isLocked ? 'scale(1.08)' : 'scale(1)',
    transition:
      'filter 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    willChange: 'filter, transform',
  };
  const backdropStyle: React.CSSProperties = {
    backdropFilter: isLocked ? 'blur(16px) saturate(1.6)' : 'blur(0px) saturate(1)',
    WebkitBackdropFilter: isLocked ? 'blur(16px) saturate(1.6)' : 'blur(0px) saturate(1)',
    background: isLocked ? 'rgba(0, 0, 0, 0.28)' : wallpaper.type === 'video' ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
    transition:
      'backdrop-filter 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), -webkit-backdrop-filter 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), background 1.4s ease',
    willChange: 'backdrop-filter, background',
  };

  if (wallpaper.type === 'video') {
    return (
      <div className="absolute inset-0 z-0 overflow-hidden bg-zinc-950" aria-hidden="true">
        <video
          key={wallpaper.id}
          src={wallpaper.value}
          className="h-full w-full object-cover"
          style={wallpaperStyle}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
        <div className="absolute inset-0 pointer-events-none" style={backdropStyle} />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-zinc-950" aria-hidden="true">
      <div className={`absolute inset-0 ${wallpaper.value}`} style={wallpaperStyle} />
      <div className="absolute inset-0 pointer-events-none" style={backdropStyle} />
    </div>
  );
};
