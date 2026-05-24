import React, { useRef, useEffect } from 'react';
import { useWindowStore } from '../store/useWindowStore';
import gsap from 'gsap';

interface WindowFrameProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({ id, title, children }) => {
  const {
    windows,
    activeWindow,
    closeWindow,
    minimizeWindow,
    toggleMaximizeWindow,
    focusWindow,
    updateWindowPosition,
    updateWindowSize,
  } = useWindowStore();

  const win = windows[id];
  const windowRef = useRef<HTMLDivElement>(null);
  const prevMinimizedRef = useRef(false);

  const isOpen = win?.isOpen ?? false;
  const isMinimized = win?.isMinimized ?? false;
  const isMaximized = win?.isMaximized ?? false;
  const position = win?.position ?? { x: 100, y: 100 };
  const size = win?.size ?? { width: 800, height: 600 };
  const zIndex = win?.zIndex ?? 10;
  const isFocused = activeWindow === id;

  // Window opening and minimize/restore animations
  useEffect(() => {
    if (!isOpen) return;

    if (windowRef.current) {
      if (isMinimized) {
        // Animate minimizing into the dock
        gsap.to(windowRef.current, {
          scale: 0.15,
          opacity: 0,
          y: (window.innerHeight - 50) - position.y,
          x: (window.innerWidth / 2 - size.width / 2) - position.x,
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
          startY = (window.innerHeight - 50) - position.y;
          startX = (window.innerWidth / 2 - size.width / 2) - position.x;
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
  const handleDragStart = (e: React.MouseEvent) => {
    if (isMaximized) return;
    e.preventDefault();
    focusWindow(id);

    const startX = e.clientX;
    const startY = e.clientY;
    const initX = position.x;
    const initY = position.y;

    const handleDragMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      // Restrict positioning to stay on the visible desktop area (top >= 28px for MenuBar)
      const newX = Math.max(0, Math.min(window.innerWidth - size.width, initX + deltaX));
      const newY = Math.max(28, Math.min(window.innerHeight - 100, initY + deltaY));

      updateWindowPosition(id, newX, newY);
    };

    const handleDragEnd = () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
    };

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  };

  // Handle Resizing
  const handleResizeStart = (e: React.MouseEvent, direction: 'r' | 'b' | 'br') => {
    e.preventDefault();
    e.stopPropagation();
    focusWindow(id);

    const startX = e.clientX;
    const startY = e.clientY;
    const initWidth = size.width;
    const initHeight = size.height;

    const handleResizeMove = (moveEvent: MouseEvent) => {
      let newWidth = initWidth;
      let newHeight = initHeight;

      if (direction === 'r' || direction === 'br') {
        newWidth = Math.max(380, initWidth + (moveEvent.clientX - startX));
      }
      if (direction === 'b' || direction === 'br') {
        newHeight = Math.max(280, initHeight + (moveEvent.clientY - startY));
      }

      updateWindowSize(id, newWidth, newHeight);
    };

    const handleResizeEnd = () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
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
      className={`flex flex-col rounded-xl overflow-hidden glass-panel dark:glass-panel-dark shadow-2xl transition-shadow border border-white/20 select-none ${
        isFocused ? 'ring-1 ring-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)]' : 'opacity-95 shadow-[0_10px_30px_rgba(0,0,0,0.15)]'
      }`}
    >
      {/* Title Bar */}
      <div
        onMouseDown={handleDragStart}
        className="h-10 px-4 flex items-center justify-between border-b border-black/10 dark:border-white/10 bg-slate-100/40 dark:bg-zinc-800/40 cursor-grab active:cursor-grabbing shrink-0 relative"
      >
        {/* macOS Traffic Lights (Window Controls) */}
        <div className="flex items-center gap-2 relative z-10">
          <button
            onClick={() => closeWindow(id)}
            className="w-3.5 h-3.5 rounded-full mac-traffic-red hover:brightness-75 transition-all flex items-center justify-center text-[8px] text-red-950 font-bold group"
          >
            <span className="opacity-0 group-hover:opacity-100 select-none">✕</span>
          </button>
          
          <button
            onClick={() => minimizeWindow(id)}
            className="w-3.5 h-3.5 rounded-full mac-traffic-yellow hover:brightness-75 transition-all flex items-center justify-center text-[8px] text-yellow-950 font-bold group"
          >
            <span className="opacity-0 group-hover:opacity-100 select-none">—</span>
          </button>
          
          <button
            onClick={() => toggleMaximizeWindow(id)}
            className="w-3.5 h-3.5 rounded-full mac-traffic-green hover:brightness-75 transition-all flex items-center justify-center text-[8px] text-green-950 font-bold group"
          >
            <span className="opacity-0 group-hover:opacity-100 select-none">✙</span>
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
            onMouseDown={(e) => handleResizeStart(e, 'r')}
            className="absolute top-0 right-0 w-1.5 h-full cursor-e-resize z-20"
          />
          {/* Bottom Handle */}
          <div
            onMouseDown={(e) => handleResizeStart(e, 'b')}
            className="absolute bottom-0 left-0 w-full h-1.5 cursor-s-resize z-20"
          />
          {/* Bottom-Right Corner Handle */}
          <div
            onMouseDown={(e) => handleResizeStart(e, 'br')}
            className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize z-20"
          />
        </>
      )}
    </div>
  );
};
