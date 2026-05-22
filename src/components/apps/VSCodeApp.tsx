import React, { useState } from 'react';
import { Files, Search, GitBranch, Settings, ChevronDown, FileCode } from 'lucide-react';

interface CodeFile {
  name: string;
  path: string;
  language: string;
  content: string;
}

const FILES: Record<string, CodeFile> = {
  'App.tsx': {
    name: 'App.tsx',
    path: 'src/App.tsx',
    language: 'typescript',
    content: `import React from 'react';
import { useWindowStore } from './store/useWindowStore';
import { BootScreen } from './components/BootScreen';
import { LockScreen } from './components/LockScreen';
import { Desktop } from './components/Desktop';

export const App: React.FC = () => {
  const { isBooted, isLocked } = useWindowStore();

  if (!isBooted) return <BootScreen />;
  if (isLocked) return <LockScreen />;

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <Desktop />
    </div>
  );
};`
  },
  'useWindowStore.ts': {
    name: 'useWindowStore.ts',
    path: 'src/store/useWindowStore.ts',
    language: 'typescript',
    content: `import { create } from 'zustand';

export interface AppWindow {
  id: string;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  position: { x: number; y: number };
}

export const useWindowStore = create((set) => ({
  isBooted: false,
  isLocked: true,
  windows: {},
  
  bootSystem: () => set({ isBooted: true }),
  unlockSystem: () => set({ isLocked: false }),
  openWindow: (id) => set((state) => ({
    windows: {
      ...state.windows,
      [id]: { ...state.windows[id], isOpen: true }
    }
  })),
}));`
  },
  'Dock.tsx': {
    name: 'Dock.tsx',
    path: 'src/components/Dock.tsx',
    language: 'typescript',
    content: `import React, { useRef } from 'react';
import { useWindowStore } from '../store/useWindowStore';

export const Dock: React.FC = () => {
  const { windows, openWindow } = useWindowStore();
  const dockRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    // Math proximity scale calculation
    const children = dockRef.current?.children;
    // ... Smooth proximity GSAP scale logic
  };

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2">
      <div ref={dockRef} onMouseMove={handleMouseMove} className="glass rounded-[24px]">
        {/* Render squircle icon wrappers */}
      </div>
    </div>
  );
};`
  }
};

export const VSCodeApp: React.FC = () => {
  const [activeFileName, setActiveFileName] = useState<string>('App.tsx');
  const explorerOpen = true;

  const activeFile = FILES[activeFileName] || FILES['App.tsx'];

  // Helper function to colorize code snippets simple mockup syntax highlighting
  const renderHighlightedCode = (codeStr: string) => {
    return codeStr.split('\n').map((line, idx) => {
      // Very basic mock coloring
      const tokens = line.split(/(\s+|=|>|<|import|from|export|const|return|function|if|let|interface|class|type|\{|\}|\(|\))/);
      
      return (
        <div key={idx} className="flex leading-normal text-xs font-mono">
          {/* Line number */}
          <span className="w-8 text-right opacity-30 select-none mr-4">{idx + 1}</span>
          {/* Tokens */}
          <span>
            {tokens.map((t, tIdx) => {
              let colorClass = 'text-zinc-300';
              if (/import|from|export|const|return|function|if|let|interface|class|type/.test(t)) {
                colorClass = 'text-indigo-400 font-semibold'; // keywords
              } else if (/[A-Z]\w+/.test(t) && !/FC|React/.test(t)) {
                colorClass = 'text-amber-300'; // components/classes
              } else if (/'[^']*'|"[^"]*"/.test(t)) {
                colorClass = 'text-emerald-400'; // strings
              } else if (/\/\/.*/.test(t)) {
                colorClass = 'text-zinc-500 italic'; // comments
              } else if (/[={}()<>]/.test(t)) {
                colorClass = 'text-indigo-300'; // brackets
              }
              return (
                <span key={tIdx} className={colorClass}>
                  {t}
                </span>
              );
            })}
          </span>
        </div>
      );
    });
  };

  return (
    <div className="flex h-full w-full bg-zinc-900 text-zinc-300 select-none">
      {/* Activity Bar (Slim left side) */}
      <div className="w-12 border-r border-zinc-800 bg-zinc-950 flex flex-col justify-between items-center py-4 shrink-0 text-zinc-500">
        <div className="flex flex-col gap-5 items-center">
          <button className="text-zinc-200 hover:text-white transition-all">
            <Files className="w-5 h-5" />
          </button>
          <button className="hover:text-white transition-all">
            <Search className="w-5 h-5" />
          </button>
          <button className="hover:text-white transition-all">
            <GitBranch className="w-5 h-5" />
          </button>
        </div>
        <div>
          <button className="hover:text-white transition-all">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Side Bar (Explorer Tree) */}
      {explorerOpen && (
        <div className="w-48 bg-zinc-900 border-r border-zinc-800 p-2 shrink-0 flex flex-col">
          <div className="flex items-center justify-between px-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            <span>Explorer</span>
          </div>
          
          <div className="mt-3">
            <button className="flex items-center gap-1 text-xs text-zinc-300 font-bold px-1.5 py-0.5 w-full text-left">
              <ChevronDown className="w-3.5 h-3.5" />
              <span>sharp-bose</span>
            </button>

            <div className="flex flex-col gap-0.5 mt-1 ml-3">
              <button className="flex items-center gap-1 text-xs text-zinc-400 px-1.5 py-0.5 w-full text-left">
                <ChevronDown className="w-3.5 h-3.5" />
                <span>src</span>
              </button>

              <div className="flex flex-col gap-0.5 ml-3.5">
                {Object.keys(FILES).map((fname) => (
                  <button
                    key={fname}
                    onClick={() => setActiveFileName(fname)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs w-full text-left transition-all ${
                      activeFileName === fname
                        ? 'bg-zinc-800 text-sky-400 font-semibold border-l-2 border-sky-500 rounded-l-none pl-1.5'
                        : 'hover:bg-zinc-800/40 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{fname}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editor Main Content Area */}
      <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden">
        {/* Editor Tabs bar */}
        <div className="h-9 border-b border-zinc-800 bg-zinc-900 flex items-center shrink-0">
          {Object.keys(FILES).map((fname) => (
            <button
              key={fname}
              onClick={() => setActiveFileName(fname)}
              className={`h-9 px-4 border-r border-zinc-800 flex items-center gap-1.5 text-xs transition-all ${
                activeFileName === fname
                  ? 'bg-zinc-950 text-sky-400 font-semibold border-t-2 border-sky-500 border-b border-b-transparent'
                  : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-900/60'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              <span>{fname}</span>
            </button>
          ))}
        </div>

        {/* Highlighted code editor window pane */}
        <div className="flex-1 overflow-auto p-4 select-text selection:bg-indigo-500/30">
          <pre className="text-zinc-300 select-text leading-relaxed">
            <code>{renderHighlightedCode(activeFile.content)}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
