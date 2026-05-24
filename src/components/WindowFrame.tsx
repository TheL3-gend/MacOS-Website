import React, { useRef, useEffect } from 'react';
import { useWindowStore } from '../store/useWindowStore';
import gsap from 'gsap';

interface WindowFrameProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

type ResizeDirection = 'r' | 'b' | 'br';

const DEFAULT_POSITION = { x: 100, y: 100 };
const DEFAULT_SIZE = { width: 800, height: 600 };
const MENU_BAR_HEIGHT = 28;
const DOCK_RESERVED_HEIGHT = 100;
const MIN_WINDOW_WIDTH = 380;
const MIN_WINDOW_HEIGHT = 280;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const WindowFrame: React.FC<WindowFrameProps> = ({ id, title, children }) => {
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
    if (!isOpen) return;

    if (windowRef.current) {
      const currentPosition = latestPositionRef.current;
      const currentSize = latestSizeRef.current;

      if (isMinimized) {
        // Animate minimizing into the dock
        gsap.to(windowRef.current, {
          scale: 0.15,
          opacity: 0,
          y: (window.innerHeight - 50) - currentPosition.y,
          x: (window.innerWidth / 2 - currentSize.width / 2) - currentPosition.x,
          duration: 0.35,
          ease: 'power2.inOut',
          onComplete: () => {
            if (windowRef.current) windowRef.current.style.display = 'none';
          },
        });
      } else {
        // Animate opening/restoring
        windowRef.current.style.display = 'flex';

        let startScale = 0.85;
        let startOpacity = 0;
        let startY = 40;
        let startX = 0;

        // If it was previously minimized and is now restored
        if (prevMinimizedRef.current && !isMinimized) {
          startScale = 0.15;
          startOpacity = 0;
          startY = (window.innerHeight - 50) - currentPosition.y;
          startX = (window.innerWidth / 2 - currentSize.width / 2) - currentPosition.x;
        }

        gsap.fromTo(
          windowRef.current,
          {
            scale: startScale,
            opacity: startOpacity,
            y: startY,
            x: startX,
          },
          {
            scale: 1,
            opacity: 1,
            y: 0,
            x: 0,
            duration: 0.35,
            ease: 'power2.out',
          }
        );
      }
    }
    prevMinimizedRef.current = isMinimized;
  }, [isMinimized, isOpen]);

  if (!isOpen) return null;

  // Handle Dragging
  const handleDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isMaximized || e.button !== 0) return;

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
      const maxX = Math.max(0, window.innerWidth - size.width);
      const maxY = window.innerHeight - DOCK_RESERVED_HEIGHT;

      // Restrict positioning to stay on the visible desktop area.
      nextX = clamp(initX + deltaX, 0, maxX);
      nextY = clamp(initY + deltaY, MENU_BAR_HEIGHT, maxY);
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
    if (e.button !== 0) return;

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

      if (direction === 'r' || direction === 'br') {
        nextWidth = Math.max(MIN_WINDOW_WIDTH, initWidth + (moveEvent.clientX - startX));
      }
      if (direction === 'b' || direction === 'br') {
        nextHeight = Math.max(MIN_WINDOW_HEIGHT, initHeight + (moveEvent.clientY - startY));
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
  const windowStyle: React.CSSProperties = isMaximized
    ? {
        position: 'absolute',
        top: '28px', // height of menu bar
        left: '0px',
        width: '100vw',
        height: 'calc(100vh - 28px - 72px)', // minus menubar and dock
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
      style={windowStyle}
      onClick={() => focusWindow(id)}
      className={`window-frame flex flex-col rounded-xl overflow-hidden glass-panel dark:glass-panel-dark shadow-2xl transition-shadow border border-white/20 select-none ${
        isFocused ? 'ring-1 ring-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)]' : 'opacity-95 shadow-[0_10px_30px_rgba(0,0,0,0.15)]'
      }`}
    >
      {/* Title Bar */}
      <div
        onPointerDown={handleDragStart}
        className="window-titlebar h-10 px-4 flex items-center justify-between border-b border-black/10 dark:border-white/10 bg-slate-100/40 dark:bg-zinc-800/40 cursor-grab active:cursor-grabbing shrink-0 relative"
      >
        {/* macOS Traffic Lights (Window Controls) */}
        <div className="flex items-center gap-2 relative z-10" onPointerDown={(e) => e.stopPropagation()}>
          <button
            onClick={() => closeWindow(id)}
            className="w-3.5 h-3.5 rounded-full mac-traffic-red hover:brightness-75 transition-all flex items-center justify-center text-[8px] text-red-950 font-bold group"
          >
            <span className="opacity-0 group-hover:opacity-100 select-none">x</span>
          </button>

          <button
            onClick={() => minimizeWindow(id)}
            className="w-3.5 h-3.5 rounded-full mac-traffic-yellow hover:brightness-75 transition-all flex items-center justify-center text-[8px] text-yellow-950 font-bold group"
          >
            <span className="opacity-0 group-hover:opacity-100 select-none">-</span>
          </button>

          <button
            onClick={() => toggleMaximizeWindow(id)}
            className="w-3.5 h-3.5 rounded-full mac-traffic-green hover:brightness-75 transition-all flex items-center justify-center text-[8px] text-green-950 font-bold group"
          >
            <span className="opacity-0 group-hover:opacity-100 select-none">+</span>
          </button>
        </div>

        {/* Title Text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            {title}
          </span>
        </div>

        {/* Empty placeholder for alignment */}
        <div className="w-14" />
      </div>

      {/* Window Content */}
      <div className="flex-1 overflow-hidden relative bg-slate-50/95 dark:bg-zinc-950/90 text-zinc-900 dark:text-zinc-100">
        {children}
      </div>

      {/* Resize Anchors (Only show if not maximized) */}
      {!isMaximized && (
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
