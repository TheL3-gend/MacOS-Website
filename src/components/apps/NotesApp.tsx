import React, { useState, useEffect } from 'react';
import { FileText, Save, Info } from 'lucide-react';

export const NotesApp: React.FC = () => {
  const [noteContent, setNoteContent] = useState<string>(() => {
    return localStorage.getItem('macos_portfolio_note') || 
      `# Welcome to Notes!\n\nThis notepad persists your writing to local browser storage automatically.\n\nThings to check out in this MacOS Portfolio:\n1. Click "Secret" command in the Terminal.\n2. Switch Wallpapers in System Settings.\n3. Bid on the Cosmic NFT inside Chrome.\n4. Explore the VS Code Editor files.\n\nEnjoy exploring!`;
  });

  const [savedStatus, setSavedStatus] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('macos_portfolio_note', noteContent);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSavedStatus(true);
    const timer = setTimeout(() => setSavedStatus(false), 800);
    return () => clearTimeout(timer);
  }, [noteContent]);

  return (
    <div className="notes-app flex flex-col h-full w-full bg-amber-50/40 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 select-none">
      {/* Notes app header status bar */}
      <div className="h-9 px-3 bg-amber-100/30 dark:bg-zinc-900/50 border-b border-amber-200/20 dark:border-zinc-800/60 flex items-center justify-between shrink-0 text-[10px] font-semibold text-slate-500">
        <span className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-amber-500" />
          Quick Notes.txt
        </span>
        <span className="flex items-center gap-1">
          <Save className="w-3 h-3 text-zinc-400" />
          {savedStatus ? 'Saved' : 'Auto-saved'}
        </span>
      </div>

      {/* Editor TextArea */}
      <div className="flex-1 p-4 relative">
        <textarea
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          className="w-full h-full bg-transparent border-none outline-none focus:ring-0 focus:outline-none p-0 text-xs font-mono leading-relaxed resize-none text-slate-900 dark:text-zinc-100"
          placeholder="Start writing notes..."
          autoFocus
          spellCheck="false"
        />
      </div>

      {/* App bottom info banner bar */}
      <div className="h-6 px-3 bg-amber-100/10 dark:bg-zinc-900/20 border-t border-amber-200/10 dark:border-zinc-800/30 flex items-center gap-1 text-[9px] opacity-75 shrink-0 select-none">
        <Info className="w-2.5 h-2.5 text-slate-400" />
        <span>Type markdown or lists; it will persist on reload.</span>
      </div>
    </div>
  );
};
