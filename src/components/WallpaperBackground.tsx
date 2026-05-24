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
  const lockScreenClasses = isLocked
    ? 'blur-2xl scale-110 saturate-125'
    : 'blur-none scale-100 saturate-100';

  const transitionStyle = {
    transition: 'filter 1.2s cubic-bezier(0.16, 1, 0.3, 1), transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
  };

  if (wallpaper.type === 'video') {
    return (
      <div className="absolute inset-0 z-0 overflow-hidden bg-zinc-950">
        <video
          key={wallpaper.id}
          src={wallpaper.value}
          className={`h-full w-full object-cover ${lockScreenClasses}`}
          style={transitionStyle}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />
      </div>
    );
  }

  return (
    <div
      className={`absolute inset-0 z-0 ${wallpaper.value} ${lockScreenClasses}`}
      style={transitionStyle}
    />
  );
};
