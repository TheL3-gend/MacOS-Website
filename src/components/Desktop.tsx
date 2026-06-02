import React from 'react';
import { useWindowStore } from '../store/useWindowStore';
import { WindowFrame } from './WindowFrame';
import { FinderApp } from './apps/FinderApp';
import { TerminalApp } from './apps/TerminalApp';
import { ChromeApp } from './apps/ChromeApp';
import { VSCodeApp } from './apps/VSCodeApp';
import { NotesApp } from './apps/NotesApp';
import { SettingsApp } from './apps/SettingsApp';
import { Terminal, Settings, FileText, Code2, FolderOpen, FileCode2 } from 'lucide-react';
import { ChromeIcon } from './icons/appicons';
import {
  loadVirtualDesktopFiles,
  requestOpenDesktopFile,
  VIRTUAL_DESKTOP_FILES_EVENT,
  type VirtualDesktopFile,
} from '../lib/virtualDesktopFiles';

interface DesktopIcon {
  id: string;
  name: string;
  icon: React.ReactNode;
  bgClass: string;
}

interface DesktopIconPosition {
  x: number;
  y: number;
}

const ICON_WIDTH = 72;
const ICON_HEIGHT = 76;
const ICON_TOP_OFFSET = 48;
const ICON_RIGHT_OFFSET = 24;
const ICON_VERTICAL_GAP = 24;
const ICON_BOTTOM_MARGIN = 12;
const DRAG_THRESHOLD = 4;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const getDefaultIconPosition = (
  index: number,
  bounds: { width: number; height: number }
): DesktopIconPosition => {
  const maxX = Math.max(0, bounds.width - ICON_WIDTH);
  const maxY = Math.max(ICON_TOP_OFFSET, bounds.height - ICON_BOTTOM_MARGIN - ICON_HEIGHT);

  return {
    x: clamp(bounds.width - ICON_RIGHT_OFFSET - ICON_WIDTH, 0, maxX),
    y: clamp(ICON_TOP_OFFSET + index * (ICON_HEIGHT + ICON_VERTICAL_GAP), ICON_TOP_OFFSET, maxY),
  };
};

interface DesktopProps {
  isPhoneLandscape?: boolean;
}

export const Desktop: React.FC<DesktopProps> = ({ isPhoneLandscape = false }) => {
  const openWindow = useWindowStore((state) => state.openWindow);
  const focusWindow = useWindowStore((state) => state.focusWindow);
  const desktopRef = React.useRef<HTMLDivElement>(null);
  const draggedIconRef = React.useRef<string | null>(null);
  const [draggingIconId, setDraggingIconId] = React.useState<string | null>(null);
  const [iconPositions, setIconPositions] = React.useState<Record<string, DesktopIconPosition>>({});
  const [desktopBounds, setDesktopBounds] = React.useState({ width: 0, height: 0 });
  const [desktopFiles, setDesktopFiles] = React.useState<VirtualDesktopFile[]>(() =>
    loadVirtualDesktopFiles()
  );

  const handleIconDoubleClick = (id: string) => {
    if (draggedIconRef.current === id) return;
    openWindow(id);
    focusWindow(id);
  };

  const handleDesktopFileDoubleClick = (file: VirtualDesktopFile) => {
    requestOpenDesktopFile(file.id);
    openWindow('vscode');
    focusWindow('vscode');
  };

  const icons = React.useMemo<DesktopIcon[]>(
    () => [
      {
        id: 'finder',
        name: 'Finder',
        bgClass: 'bg-gradient-to-b from-sky-400 to-blue-600 border border-blue-400/40',
        icon: <FolderOpen className="w-5 h-5 text-white" />,
      },
      {
        id: 'terminal',
        name: 'Terminal',
        bgClass: 'bg-gradient-to-b from-zinc-800 to-zinc-950 border border-zinc-700/50',
        icon: <Terminal className="w-5 h-5 text-green-400" />,
      },
      {
        id: 'chrome',
        name: 'Chrome',
        bgClass: 'bg-gradient-to-b from-white to-slate-100 border border-slate-200',
        icon: <ChromeIcon className="w-7 h-7" />,
      },
      {
        id: 'vscode',
        name: 'VS Code',
        bgClass: 'bg-gradient-to-b from-indigo-950 to-indigo-900 border border-indigo-700/50',
        icon: <Code2 className="w-5 h-5 text-sky-400" />,
      },
      {
        id: 'notes',
        name: 'Notes',
        bgClass: 'bg-gradient-to-b from-amber-300 to-amber-400 border border-amber-300/50',
        icon: <FileText className="w-5 h-5 text-amber-950" />,
      },
      {
        id: 'settings',
        name: 'System Settings',
        bgClass: 'bg-gradient-to-b from-slate-400 to-slate-600 border border-slate-400/40',
        icon: <Settings className="w-5 h-5 text-white" />,
      },
    ],
    []
  );

  React.useLayoutEffect(() => {
    const desktop = desktopRef.current;
    if (!desktop) return;

    const updateIconPositionsForBounds = () => {
      const bounds = {
        width: desktop.clientWidth,
        height: desktop.clientHeight,
      };

      setDesktopBounds(bounds);
      setIconPositions((current) => {
        let changed = false;
        const next: Record<string, DesktopIconPosition> = { ...current };
        const iconIds = new Set(icons.map((icon) => icon.id));
        const maxX = Math.max(0, bounds.width - ICON_WIDTH);
        const maxY = Math.max(ICON_TOP_OFFSET, bounds.height - ICON_BOTTOM_MARGIN - ICON_HEIGHT);

        Object.keys(next).forEach((id) => {
          if (!iconIds.has(id)) {
            delete next[id];
            changed = true;
          }
        });

        icons.forEach((icon, index) => {
          const currentPosition = next[icon.id] ?? getDefaultIconPosition(index, bounds);
          const clampedPosition = {
            x: clamp(currentPosition.x, 0, maxX),
            y: clamp(currentPosition.y, ICON_TOP_OFFSET, maxY),
          };

          if (
            !next[icon.id] ||
            next[icon.id].x !== clampedPosition.x ||
            next[icon.id].y !== clampedPosition.y
          ) {
            next[icon.id] = clampedPosition;
            changed = true;
          }
        });

        return changed ? next : current;
      });
    };

    updateIconPositionsForBounds();

    const resizeObserver = new ResizeObserver(updateIconPositionsForBounds);
    resizeObserver.observe(desktop);

    return () => {
      resizeObserver.disconnect();
    };
  }, [icons]);

  React.useEffect(() => {
    const refreshDesktopFiles = () => setDesktopFiles(loadVirtualDesktopFiles());

    window.addEventListener(VIRTUAL_DESKTOP_FILES_EVENT, refreshDesktopFiles);
    window.addEventListener('storage', refreshDesktopFiles);

    return () => {
      window.removeEventListener(VIRTUAL_DESKTOP_FILES_EVENT, refreshDesktopFiles);
      window.removeEventListener('storage', refreshDesktopFiles);
    };
  }, []);

  const handleIconPointerDown = (e: React.PointerEvent<HTMLButtonElement>, id: string) => {
    if (isPhoneLandscape) return;
    if (e.button !== 0) return;

    const desktop = desktopRef.current;
    const startPosition = iconPositions[id];
    if (!desktop || !startPosition) return;

    const iconElement = e.currentTarget;
    const pointerId = e.pointerId;
    const startX = e.clientX;
    const startY = e.clientY;
    const initX = startPosition.x;
    const initY = startPosition.y;
    const bounds = {
      width: desktop.clientWidth,
      height: desktop.clientHeight,
    };
    const maxX = Math.max(0, bounds.width - ICON_WIDTH);
    const maxY = Math.max(ICON_TOP_OFFSET, bounds.height - ICON_BOTTOM_MARGIN - ICON_HEIGHT);
    let nextX = initX;
    let nextY = initY;
    let hasDragged = false;
    let rafId: number | null = null;

    iconElement.setPointerCapture(pointerId);
    iconElement.style.willChange = 'transform';
    document.body.classList.add('desktop-icon-is-dragging');
    setDraggingIconId(id);

    const applyDragFrame = () => {
      rafId = null;
      iconElement.style.transform = `translate3d(${nextX - initX}px, ${nextY - initY}px, 0)`;
    };

    const scheduleDragFrame = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(applyDragFrame);
      }
    };

    const finishDrag = (event: PointerEvent, shouldOpenTouchIcon: boolean) => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }

      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerCancel);
      document.body.classList.remove('desktop-icon-is-dragging');

      try {
        iconElement.releasePointerCapture(pointerId);
      } catch {
        // Pointer capture can already be released by the browser on cancel.
      }

      iconElement.style.willChange = '';
      iconElement.style.transform = '';
      setDraggingIconId(null);

      if (hasDragged) {
        draggedIconRef.current = id;
        window.setTimeout(() => {
          if (draggedIconRef.current === id) {
            draggedIconRef.current = null;
          }
        }, 250);
      }

      setIconPositions((current) => ({
        ...current,
        [id]: { x: nextX, y: nextY },
      }));

      if (!hasDragged && shouldOpenTouchIcon && event.pointerType !== 'mouse') {
        handleIconDoubleClick(id);
      }
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return;

      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      if (!hasDragged && Math.hypot(deltaX, deltaY) >= DRAG_THRESHOLD) {
        hasDragged = true;
      }

      nextX = clamp(initX + deltaX, 0, maxX);
      nextY = clamp(initY + deltaY, ICON_TOP_OFFSET, maxY);
      scheduleDragFrame();
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== pointerId) return;
      finishDrag(upEvent, true);
    };

    const handlePointerCancel = (cancelEvent: PointerEvent) => {
      if (cancelEvent.pointerId !== pointerId) return;
      finishDrag(cancelEvent, false);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerCancel);
  };

  return (
    <div
      ref={desktopRef}
      className={`relative w-full h-full flex-1 overflow-hidden select-none ${
        isPhoneLandscape ? 'p-0' : 'p-6 pt-12'
      }`}
    >
      
      {/* Desktop shortcuts */}
      <div className={isPhoneLandscape ? 'phone-desktop-icons' : 'absolute inset-0'}>
        {icons.map((ico) => {
          const position = iconPositions[ico.id];
          const isDragging = draggingIconId === ico.id;

          return (
          <button
            key={ico.id}
            type="button"
            aria-label={ico.name}
            onClick={isPhoneLandscape ? () => handleIconDoubleClick(ico.id) : undefined}
            onDoubleClick={isPhoneLandscape ? undefined : () => handleIconDoubleClick(ico.id)}
            onPointerDown={(e) => handleIconPointerDown(e, ico.id)}
            className={`desktop-icon flex flex-col items-center gap-1 text-center group ${
              isPhoneLandscape ? 'relative cursor-pointer' : 'absolute cursor-grab active:cursor-grabbing'
            }`}
            style={{
              left: !isPhoneLandscape && position ? `${position.x}px` : undefined,
              top: !isPhoneLandscape && position ? `${position.y}px` : undefined,
              width: isPhoneLandscape ? '62px' : `${ICON_WIDTH}px`,
              zIndex: isDragging ? 20 : 1,
              opacity: isPhoneLandscape || position ? 1 : 0,
            }}
          >
            {/* Desktop Icon Squircle frame */}
            <div
              className={`${isPhoneLandscape ? 'w-10 h-10 rounded-xl' : 'w-12 h-12 rounded-[13px]'} flex items-center justify-center shadow-lg group-hover:brightness-95 group-active:scale-95 transition-all ${ico.bgClass}`}
            >
              {ico.icon}
            </div>
            {/* Label with light drop shadow for high readability */}
            <span className={`${isPhoneLandscape ? 'text-[9px]' : 'text-[10px]'} text-white font-semibold tracking-wide drop-shadow-md bg-black/15 group-hover:bg-black/30 px-1.5 py-0.5 rounded-md transition-all select-none`}>
              {ico.name}
            </span>
          </button>
          );
        })}

        {desktopFiles.map((file, index) => {
          const position = getDefaultIconPosition(icons.length + index, desktopBounds);

          return (
            <button
              key={file.id}
              type="button"
              data-testid="virtual-desktop-file"
              aria-label={`Open ${file.name}`}
              onClick={isPhoneLandscape ? () => handleDesktopFileDoubleClick(file) : undefined}
              onDoubleClick={isPhoneLandscape ? undefined : () => handleDesktopFileDoubleClick(file)}
              className={`desktop-icon flex flex-col items-center gap-1 text-center group ${
                isPhoneLandscape ? 'relative cursor-pointer' : 'absolute cursor-pointer'
              }`}
              style={{
                left: !isPhoneLandscape ? `${position.x}px` : undefined,
                top: !isPhoneLandscape ? `${position.y}px` : undefined,
                width: isPhoneLandscape ? '62px' : `${ICON_WIDTH}px`,
                zIndex: 1,
                opacity: desktopBounds.width || isPhoneLandscape ? 1 : 0,
              }}
            >
              <div
                className={`${isPhoneLandscape ? 'w-10 h-10 rounded-xl' : 'w-12 h-12 rounded-[13px]'} flex items-center justify-center shadow-lg group-hover:brightness-105 group-active:scale-95 transition-all bg-gradient-to-b from-slate-50 to-slate-200 border border-slate-200`}
              >
                <FileCode2 className="w-6 h-6 text-sky-600" />
              </div>
              <span className={`${isPhoneLandscape ? 'text-[9px]' : 'text-[10px]'} max-w-[68px] truncate text-white font-semibold tracking-wide drop-shadow-md bg-black/15 group-hover:bg-black/30 px-1.5 py-0.5 rounded-md transition-all select-none`}>
                {file.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Render all open application windows wrapped inside WindowFrame */}
      <WindowFrame id="finder" title="Finder" isPhoneLandscape={isPhoneLandscape}>
        <FinderApp />
      </WindowFrame>

      <WindowFrame id="terminal" title="Terminal" isPhoneLandscape={isPhoneLandscape}>
        <TerminalApp />
      </WindowFrame>

      <WindowFrame id="chrome" title="Chrome" isPhoneLandscape={isPhoneLandscape}>
        <ChromeApp />
      </WindowFrame>

      <WindowFrame id="vscode" title="VS Code" isPhoneLandscape={isPhoneLandscape}>
        <VSCodeApp />
      </WindowFrame>

      <WindowFrame id="notes" title="Notes" isPhoneLandscape={isPhoneLandscape}>
        <NotesApp />
      </WindowFrame>

      <WindowFrame id="settings" title="System Settings" isPhoneLandscape={isPhoneLandscape}>
        <SettingsApp />
      </WindowFrame>

    </div>
  );
};
