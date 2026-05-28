import React, { useRef, useEffect } from 'react';
import { useWindowStore } from '../store/useWindowStore';
import gsap from 'gsap';

interface WindowFrameProps {
  id: string;
  title: string;
  children: React.ReactNode;
  isPhoneLandscape?: boolean;
}

type ResizeDirection = 'r' | 'b' | 'br';

const DEFAULT_POSITION = { x: 100, y: 100 };
const DEFAULT_SIZE = { width: 800, height: 600 };
const MENU_BAR_HEIGHT = 28;
const MIN_WINDOW_WIDTH = 380;
const MIN_WINDOW_HEIGHT = 280;
const FULLSCREEN_ANIMATION_DURATION = 0.58;
const MINIMIZE_ANIMATION_DURATION = 0.48;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const getDesktopBounds = () => ({
  minX: 0,
  minY: MENU_BAR_HEIGHT,
  maxX: window.innerWidth,
  maxY: Math.max(MENU_BAR_HEIGHT + MIN_WINDOW_HEIGHT, window.innerHeight),
});

const getFullscreenFrame = () => ({
  top: MENU_BAR_HEIGHT,
  left: 0,
  width: window.innerWidth,
  height: window.innerHeight - MENU_BAR_HEIGHT,
});

const getPhoneLandscapeFrame = () => ({
  top: 34,
  left: 8,
  width: Math.max(320, window.innerWidth - 16),
  height: Math.max(232, window.innerHeight - 104),
});

const getDockTargetCenter = (appId: string) => {
  const dockItem = Array.from(document.querySelectorAll<HTMLElement>('[data-dock-app-id]')).find(
    (element) => element.dataset.dockAppId === appId
  );
  const dockIcon = dockItem?.querySelector<HTMLElement>('.dock-icon-wrap') ?? dockItem;
  const dockIconRect = dockIcon?.getBoundingClientRect();

  if (dockIconRect) {
    return {
      x: dockIconRect.left + dockIconRect.width / 2,
      y: dockIconRect.top + dockIconRect.height / 2,
    };
  }

  return {
    x: window.innerWidth / 2,
    y: window.innerHeight - 34,
  };
};

const getDockTargetOffset = (
  frame: { top: number; left: number; width: number; height: number },
  appId: string
) => {
  const dockTargetCenter = getDockTargetCenter(appId);

  return {
    x: dockTargetCenter.x - (frame.left + frame.width / 2),
    y: dockTargetCenter.y - (frame.top + frame.height / 2),
  };
};

export const WindowFrame: React.FC<WindowFrameProps> = ({
  id,
  title,
  children,
  isPhoneLandscape = false,
}) => {
  const win = useWindowStore((state) => state.windows[id]);
  const activeWindow = useWindowStore((state) => state.activeWindow);
  const closeWindow = useWindowStore((state) => state.closeWindow);
  const minimizeWindow = useWindowStore((state) => state.minimizeWindow);
  const toggleMaximizeWindow = useWindowStore((state) => state.toggleMaximizeWindow);
  const focusWindow = useWindowStore((state) => state.focusWindow);
  const updateWindowPosition = useWindowStore((state) => state.updateWindowPosition);
  const updateWindowSize = useWindowStore((state) => state.updateWindowSize);

  const windowRef = useRef<HTMLDivElement>(null);
  const prevMinimizedRef = useRef(false);
  const prevOpenRef = useRef(false);
  const prevMaximizedRef = useRef(false);

  const isOpen = win?.isOpen ?? false;
  const isMinimized = win?.isMinimized ?? false;
  const isMaximized = win?.isMaximized ?? false;
  const position = win?.position ?? DEFAULT_POSITION;
  const size = win?.size ?? DEFAULT_SIZE;
  const zIndex = win?.zIndex ?? 10;
  const isFocused = activeWindow === id;
  const latestPositionRef = useRef(position);
  const latestSizeRef = useRef(size);

  useEffect(() => {
    latestPositionRef.current = position;
  }, [position]);

  useEffect(() => {
    latestSizeRef.current = size;
  }, [size]);

  // Window opening and minimize/restore animations
  useEffect(() => {
    if (!isOpen) {
      prevOpenRef.current = false;
      prevMinimizedRef.current = isMinimized;
      return;
    }

    const wasOpen = prevOpenRef.current;
    const minimizedChanged = prevMinimizedRef.current !== isMinimized;
    if (wasOpen && !minimizedChanged) return;

    if (windowRef.current) {
      const currentPosition = latestPositionRef.current;
      const currentSize = latestSizeRef.current;
      const currentFrame = isPhoneLandscape
        ? getPhoneLandscapeFrame()
        : isMaximized
          ? getFullscreenFrame()
          : {
              top: currentPosition.y,
              left: currentPosition.x,
              width: currentSize.width,
              height: currentSize.height,
            };
      const dockTargetOffset = getDockTargetOffset(currentFrame, id);

      if (isMinimized) {
        // Animate minimizing into the dock
        const visibleFrame = windowRef.current.getBoundingClientRect();
        const visibleDockTargetOffset = getDockTargetOffset(
          {
            top: visibleFrame.top,
            left: visibleFrame.left,
            width: visibleFrame.width,
            height: visibleFrame.height,
          },
          id
        );

        gsap.killTweensOf(windowRef.current);
        windowRef.current.style.willChange = 'transform, opacity, filter';
        gsap.to(windowRef.current, {
          scale: 0.12,
          opacity: 0,
          x: visibleDockTargetOffset.x,
          y: visibleDockTargetOffset.y,
          filter: 'blur(2px)',
          transformOrigin: 'center center',
          duration: MINIMIZE_ANIMATION_DURATION,
          ease: 'power3.inOut',
          onComplete: () => {
            const currentWindow = useWindowStore.getState().windows[id];
            if (windowRef.current) {
              windowRef.current.style.willChange = '';
              if (currentWindow?.isMinimized) {
                windowRef.current.style.display = 'none';
              }
            }
          },
        });
      } else {
        // Animate opening/restoring
        windowRef.current.style.display = 'flex';

        let startScale = 0.85;
        let startOpacity = 0;
        let startY = 40;
        let startX = 0;
        let startFilter = 'blur(0px)';

        // If it was previously minimized and is now restored
        if (prevMinimizedRef.current && !isMinimized) {
          startScale = 0.12;
          startOpacity = 0;
          startY = dockTargetOffset.y;
          startX = dockTargetOffset.x;
          startFilter = 'blur(2px)';
        }

        gsap.killTweensOf(windowRef.current);
        windowRef.current.style.willChange = 'transform, opacity, filter';
        gsap.fromTo(
          windowRef.current,
          {
            scale: startScale,
            opacity: startOpacity,
            y: startY,
            x: startX,
            filter: startFilter,
            transformOrigin: 'center center',
          },
          {
            scale: 1,
            opacity: 1,
            y: 0,
            x: 0,
            filter: 'blur(0px)',
            duration: prevMinimizedRef.current ? MINIMIZE_ANIMATION_DURATION : 0.35,
            ease: prevMinimizedRef.current ? 'back.out(1.08)' : 'power2.out',
            onComplete: () => {
              if (windowRef.current) windowRef.current.style.willChange = '';
            },
          }
        );
      }
    }
    prevMinimizedRef.current = isMinimized;
    prevOpenRef.current = isOpen;
  }, [id, isMaximized, isMinimized, isOpen, isPhoneLandscape]);

  React.useLayoutEffect(() => {
    const element = windowRef.current;
    const wasMaximized = prevMaximizedRef.current;

    if (isPhoneLandscape || !isOpen || isMinimized || !element || wasMaximized === isMaximized) {
      prevMaximizedRef.current = isMaximized;
      return;
    }

    const currentPosition = latestPositionRef.current;
    const currentSize = latestSizeRef.current;
    const normalFrame = {
      top: currentPosition.y,
      left: currentPosition.x,
      width: currentSize.width,
      height: currentSize.height,
    };
    const fullscreenFrame = getFullscreenFrame();
    const fromFrame = isMaximized ? normalFrame : fullscreenFrame;
    const toFrame = isMaximized ? fullscreenFrame : normalFrame;

    gsap.killTweensOf(element);
    element.style.display = 'flex';
    element.style.willChange = 'top, left, width, height';

    gsap.fromTo(
      element,
      {
        top: fromFrame.top,
        left: fromFrame.left,
        width: fromFrame.width,
        height: fromFrame.height,
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1,
      },
      {
        top: toFrame.top,
        left: toFrame.left,
        width: toFrame.width,
        height: toFrame.height,
        duration: FULLSCREEN_ANIMATION_DURATION,
        ease: 'power3.inOut',
        onComplete: () => {
          element.style.willChange = '';
        },
      }
    );

    prevMaximizedRef.current = isMaximized;
  }, [isMaximized, isMinimized, isOpen, isPhoneLandscape]);

  if (!isOpen || (isPhoneLandscape && (isMinimized || activeWindow !== id))) return null;

  // Handle Dragging
  const handleDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPhoneLandscape || isMaximized || e.button !== 0) return;

    const element = windowRef.current;
    if (!element) return;

    e.preventDefault();
    const captureTarget = e.currentTarget;
    captureTarget.setPointerCapture(e.pointerId);
    focusWindow(id);
    gsap.killTweensOf(element);

    const startX = e.clientX;
    const startY = e.clientY;
    const initX = position.x;
    const initY = position.y;
    const pointerId = e.pointerId;
    let nextX = initX;
    let nextY = initY;
    let rafId: number | null = null;

    element.style.willChange = 'transform';
    document.body.classList.add('window-is-dragging');

    const applyDragFrame = () => {
      rafId = null;
      element.style.transform = `translate3d(${nextX - initX}px, ${nextY - initY}px, 0)`;
    };

    const scheduleDragFrame = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(applyDragFrame);
      }
    };

    const handleDragMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return;

      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      const bounds = getDesktopBounds();
      const maxX = Math.max(bounds.minX, bounds.maxX - size.width);
      const maxY = Math.max(bounds.minY, bounds.maxY - size.height);

      // Restrict positioning to stay on the visible desktop area.
      nextX = clamp(initX + deltaX, bounds.minX, maxX);
      nextY = clamp(initY + deltaY, bounds.minY, maxY);
      scheduleDragFrame();
    };

    const finishDrag = () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      document.removeEventListener('pointermove', handleDragMove);
      document.removeEventListener('pointerup', handleDragEnd);
      document.removeEventListener('pointercancel', handleDragCancel);
      document.body.classList.remove('window-is-dragging');

      try {
        captureTarget.releasePointerCapture(pointerId);
      } catch {
        // Pointer capture can already be released by the browser on cancel.
      }

      element.style.willChange = '';
      element.style.top = `${nextY}px`;
      element.style.left = `${nextX}px`;
      element.style.transform = '';
      latestPositionRef.current = { x: nextX, y: nextY };
      updateWindowPosition(id, nextX, nextY);
    };

    const handleDragEnd = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== pointerId) return;
      finishDrag();
    };

    const handleDragCancel = (cancelEvent: PointerEvent) => {
      if (cancelEvent.pointerId !== pointerId) return;
      finishDrag();
    };

    document.addEventListener('pointermove', handleDragMove);
    document.addEventListener('pointerup', handleDragEnd);
    document.addEventListener('pointercancel', handleDragCancel);
  };

  // Handle Resizing
  const handleResizeStart = (e: React.PointerEvent<HTMLDivElement>, direction: ResizeDirection) => {
    if (isPhoneLandscape || e.button !== 0) return;

    const element = windowRef.current;
    if (!element) return;

    e.preventDefault();
    e.stopPropagation();
    const captureTarget = e.currentTarget;
    captureTarget.setPointerCapture(e.pointerId);
    focusWindow(id);
    gsap.killTweensOf(element);

    const startX = e.clientX;
    const startY = e.clientY;
    const initWidth = size.width;
    const initHeight = size.height;
    const initLeft = position.x;
    const initTop = position.y;
    const pointerId = e.pointerId;
    let nextWidth = initWidth;
    let nextHeight = initHeight;
    let rafId: number | null = null;

    element.style.willChange = 'width, height';
    document.body.classList.add('window-is-resizing', `window-resizing-${direction}`);

    const applyResizeFrame = () => {
      rafId = null;
      element.style.width = `${nextWidth}px`;
      element.style.height = `${nextHeight}px`;
    };

    const scheduleResizeFrame = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(applyResizeFrame);
      }
    };

    const handleResizeMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return;

      const bounds = getDesktopBounds();
      const maxWidth = Math.max(MIN_WINDOW_WIDTH, bounds.maxX - initLeft);
      const maxHeight = Math.max(MIN_WINDOW_HEIGHT, bounds.maxY - initTop);

      if (direction === 'r' || direction === 'br') {
        nextWidth = clamp(initWidth + (moveEvent.clientX - startX), MIN_WINDOW_WIDTH, maxWidth);
      }
      if (direction === 'b' || direction === 'br') {
        nextHeight = clamp(initHeight + (moveEvent.clientY - startY), MIN_WINDOW_HEIGHT, maxHeight);
      }

      scheduleResizeFrame();
    };

    const finishResize = () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      document.removeEventListener('pointermove', handleResizeMove);
      document.removeEventListener('pointerup', handleResizeEnd);
      document.removeEventListener('pointercancel', handleResizeCancel);
      document.body.classList.remove('window-is-resizing', `window-resizing-${direction}`);

      try {
        captureTarget.releasePointerCapture(pointerId);
      } catch {
        // Pointer capture can already be released by the browser on cancel.
      }

      element.style.willChange = '';
      element.style.width = `${nextWidth}px`;
      element.style.height = `${nextHeight}px`;
      latestSizeRef.current = { width: nextWidth, height: nextHeight };
      updateWindowSize(id, nextWidth, nextHeight);
    };

    const handleResizeEnd = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== pointerId) return;
      finishResize();
    };

    const handleResizeCancel = (cancelEvent: PointerEvent) => {
      if (cancelEvent.pointerId !== pointerId) return;
      finishResize();
    };

    document.addEventListener('pointermove', handleResizeMove);
    document.addEventListener('pointerup', handleResizeEnd);
    document.addEventListener('pointercancel', handleResizeCancel);
  };

  // Combine inline styles for dynamic resizing / positioning
  const windowStyle: React.CSSProperties = isPhoneLandscape
    ? {
        position: 'absolute',
        top: 'calc(env(safe-area-inset-top) + 34px)',
        left: 'calc(env(safe-area-inset-left) + 8px)',
        width: 'calc(100vw - env(safe-area-inset-left) - env(safe-area-inset-right) - 16px)',
        height: 'max(232px, calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 104px))',
        zIndex: zIndex,
      }
    : isMaximized
      ? {
          position: 'absolute',
          top: '28px', // height of menu bar
          left: '0px',
          width: '100vw',
          height: 'calc(100vh - 28px)',
          zIndex: zIndex,
        }
      : {
          position: 'absolute',
          top: `${position.y}px`,
          left: `${position.x}px`,
          width: `${size.width}px`,
          height: `${size.height}px`,
          zIndex: zIndex,
        };

  return (
    <div
      ref={windowRef}
      data-app-window-id={id}
      style={windowStyle}
      onClick={() => focusWindow(id)}
      className={`window-frame flex flex-col rounded-xl overflow-hidden glass-panel shadow-2xl transition-shadow border border-white/20 select-none ${
        isFocused ? 'ring-1 ring-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)]' : 'opacity-95 shadow-[0_10px_30px_rgba(0,0,0,0.15)]'
      }`}
    >
      {/* Title Bar */}
      <div
        onPointerDown={handleDragStart}
        className={`window-titlebar flex items-center justify-between border-b border-black/10 dark:border-white/10 shrink-0 relative ${
          isPhoneLandscape
            ? 'h-9 px-2 cursor-default'
            : 'h-10 px-4 cursor-grab active:cursor-grabbing'
        }`}
      >
        {/* macOS Traffic Lights (Window Controls) */}
        <div
          className={`flex items-center relative z-10 ${isPhoneLandscape ? 'gap-0.5' : 'gap-2'}`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            aria-label={`Close ${title}`}
            onClick={(e) => {
              e.stopPropagation();
              closeWindow(id);
            }}
            className={`rounded-full hover:brightness-90 transition-all flex items-center justify-center text-[8px] text-red-950 font-bold group ${
              isPhoneLandscape ? 'w-8 h-8' : 'w-3.5 h-3.5 mac-traffic-red hover:brightness-75'
            }`}
          >
            <span
              className={`select-none ${
                isPhoneLandscape
                  ? 'w-3.5 h-3.5 rounded-full mac-traffic-red flex items-center justify-center'
                  : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              x
            </span>
          </button>

          <button
            type="button"
            aria-label={`Minimize ${title}`}
            onClick={(e) => {
              e.stopPropagation();
              minimizeWindow(id);
            }}
            className={`rounded-full hover:brightness-90 transition-all flex items-center justify-center text-[8px] text-yellow-950 font-bold group ${
              isPhoneLandscape ? 'w-8 h-8' : 'w-3.5 h-3.5 mac-traffic-yellow hover:brightness-75'
            }`}
          >
            <span
              className={`select-none ${
                isPhoneLandscape
                  ? 'w-3.5 h-3.5 rounded-full mac-traffic-yellow flex items-center justify-center'
                  : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              -
            </span>
          </button>

          <button
            type="button"
            aria-label={`${isMaximized ? 'Restore' : 'Maximize'} ${title}`}
            onClick={(e) => {
              e.stopPropagation();
              focusWindow(id);
              toggleMaximizeWindow(id);
            }}
            className={`rounded-full hover:brightness-90 transition-all flex items-center justify-center text-[8px] text-green-950 font-bold group ${
              isPhoneLandscape ? 'w-8 h-8' : 'w-3.5 h-3.5 mac-traffic-green hover:brightness-75'
            }`}
          >
            <span
              className={`select-none ${
                isPhoneLandscape
                  ? 'w-3.5 h-3.5 rounded-full mac-traffic-green flex items-center justify-center'
                  : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              +
            </span>
          </button>
        </div>

        {/* Title Text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className={`${isPhoneLandscape ? 'text-[11px]' : 'text-xs'} font-semibold text-zinc-800 dark:text-zinc-200`}>
            {title}
          </span>
        </div>

        {/* Empty placeholder for alignment */}
        <div className={isPhoneLandscape ? 'w-[5.75rem]' : 'w-14'} />
      </div>

      {/* Window Content */}
      <div className="flex-1 overflow-hidden relative bg-slate-50/95 dark:bg-zinc-950/90 text-zinc-900 dark:text-zinc-100">
        {children}
      </div>

      {/* Resize Anchors (Only show if not maximized) */}
      {!isPhoneLandscape && !isMaximized && (
        <>
          {/* Right Handle */}
          <div
            onPointerDown={(e) => handleResizeStart(e, 'r')}
            className="window-resize-handle absolute top-0 right-0 w-1.5 h-full cursor-e-resize z-20"
          />
          {/* Bottom Handle */}
          <div
            onPointerDown={(e) => handleResizeStart(e, 'b')}
            className="window-resize-handle absolute bottom-0 left-0 w-full h-1.5 cursor-s-resize z-20"
          />
          {/* Bottom-Right Corner Handle */}
          <div
            onPointerDown={(e) => handleResizeStart(e, 'br')}
            className="window-resize-handle absolute bottom-0 right-0 w-3 h-3 cursor-se-resize z-20"
          />
        </>
      )}
    </div>
  );
};
