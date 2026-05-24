import React from 'react';
import { WALLPAPERS } from '../store/useWindowStore';

interface WallpaperBackgroundProps {
  wallpaperId: string;
  variant?: 'desktop' | 'lock';
}

export const WallpaperBackground: React.FC<WallpaperBackgroundProps> = ({
  wallpaperId,
  variant = 'desktop',
}) => {
  const wallpaper = WALLPAPERS.find((option) => option.id === wallpaperId) ?? WALLPAPERS[0];
  const lockScreenClasses = variant === 'lock' ? 'blur-2xl scale-110 saturate-125' : '';

  if (wallpaper.type === 'video') {
    return (
      <div className="absolute inset-0 -z-10 overflow-hidden bg-zinc-950">
        <video
          key={wallpaper.id}
          src={wallpaper.value}
          className={`h-full w-full object-cover ${lockScreenClasses}`}
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
      className={`absolute inset-0 -z-10 ${wallpaper.value} ${lockScreenClasses} transition-all duration-700`}
    />
  );
};
