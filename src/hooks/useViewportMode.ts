import React from 'react';

const PHONE_MAX_SHORT_SIDE = 480;
const PHONE_MAX_LONG_SIDE = 960;

export interface ViewportMode {
  isPhoneLike: boolean;
  isPortrait: boolean;
  isPhoneLandscape: boolean;
}

const getViewportMode = (): ViewportMode => {
  if (typeof window === 'undefined') {
    return {
      isPhoneLike: false,
      isPortrait: false,
      isPhoneLandscape: false,
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const shortSide = Math.min(width, height);
  const longSide = Math.max(width, height);
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const isPhoneLike =
    isCoarsePointer &&
    shortSide <= PHONE_MAX_SHORT_SIDE &&
    longSide <= PHONE_MAX_LONG_SIDE;
  const isPortrait = height >= width;

  return {
    isPhoneLike,
    isPortrait,
    isPhoneLandscape: isPhoneLike && !isPortrait,
  };
};

export const useViewportMode = () => {
  const [viewportMode, setViewportMode] = React.useState<ViewportMode>(getViewportMode);

  React.useEffect(() => {
    const updateViewportMode = () => {
      setViewportMode(getViewportMode());
    };
    const coarsePointerQuery = window.matchMedia('(pointer: coarse)');

    updateViewportMode();
    window.addEventListener('resize', updateViewportMode);
    window.addEventListener('orientationchange', updateViewportMode);
    coarsePointerQuery.addEventListener('change', updateViewportMode);

    return () => {
      window.removeEventListener('resize', updateViewportMode);
      window.removeEventListener('orientationchange', updateViewportMode);
      coarsePointerQuery.removeEventListener('change', updateViewportMode);
    };
  }, []);

  return viewportMode;
};
