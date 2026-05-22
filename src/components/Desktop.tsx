import React from 'react';
import { useWindowStore } from '../store/useWindowStore';
import { WindowFrame } from './WindowFrame';
import { FinderApp } from './apps/FinderApp';
import { TerminalApp } from './apps/TerminalApp';
import { SafariApp } from './apps/SafariApp';
import { VSCodeApp } from './apps/VSCodeApp';
import { NotesApp } from './apps/NotesApp';
import { SettingsApp } from './apps/SettingsApp';
import { Terminal, Compass, Settings, FileText, Code2, FolderOpen } from 'lucide-react';

interface DesktopIcon {
  id: string;
  name: string;
  icon: React.ReactNode;
  bgClass: string;
}

export const Desktop: React.FC = () => {
  const { openWindow, focusWindow } = useWindowStore();

  const handleIconDoubleClick = (id: string) => {
    openWindow(id);
    focusWindow(id);
  };

  const icons: DesktopIcon[] = [
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
      id: 'safari',
      name: 'Safari',
      bgClass: 'bg-gradient-to-b from-sky-100 to-slate-200 border border-sky-300',
      icon: <Compass className="w-5 h-5 text-sky-600" />,
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
  ];

  return (
    <div className="relative w-full h-full flex-1 overflow-hidden p-6 pt-12 select-none">
      
      {/* Desktop shortcuts grid column on the right edge */}
      <div className="absolute right-6 top-12 flex flex-col gap-6 items-center">
        {icons.map((ico) => (
          <button
            key={ico.id}
            onDoubleClick={() => handleIconDoubleClick(ico.id)}
            onTouchStart={() => handleIconDoubleClick(ico.id)} // Support mobile click
            className="flex flex-col items-center gap-1 w-18 text-center group cursor-default"
          >
            {/* Desktop Icon Squircle frame */}
            <div
              className={`w-12 h-12 rounded-[13px] flex items-center justify-center shadow-lg group-hover:brightness-95 group-active:scale-95 transition-all ${ico.bgClass}`}
            >
              {ico.icon}
            </div>
            {/* Label with light drop shadow for high readability */}
            <span className="text-[10px] text-white font-semibold tracking-wide drop-shadow-md bg-black/15 group-hover:bg-black/30 px-1.5 py-0.5 rounded-md transition-all select-none">
              {ico.name}
            </span>
          </button>
        ))}
      </div>

      {/* Render all open application windows wrapped inside WindowFrame */}
      <WindowFrame id="finder" title="Finder">
        <FinderApp />
      </WindowFrame>

      <WindowFrame id="terminal" title="Terminal">
        <TerminalApp />
      </WindowFrame>

      <WindowFrame id="safari" title="Safari">
        <SafariApp />
      </WindowFrame>

      <WindowFrame id="vscode" title="VS Code">
        <VSCodeApp />
      </WindowFrame>

      <WindowFrame id="notes" title="Notes">
        <NotesApp />
      </WindowFrame>

      <WindowFrame id="settings" title="System Settings">
        <SettingsApp />
      </WindowFrame>

    </div>
  );
};
