import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface TerminalLine {
  text: string;
  type: 'input' | 'output' | 'error' | 'header';
}

const WELCOME_MESSAGE: TerminalLine[] = [
  { text: 'macOS Terminal (zsh) Simulator v1.0.0', type: 'header' },
  { text: 'Type "help" to see list of available commands.', type: 'output' },
  { text: 'Type "neofetch" to see system hardware metrics.', type: 'output' },
  { text: '', type: 'output' },
];

export const TerminalApp: React.FC = () => {
  
  const [history, setHistory] = useState<TerminalLine[]>([...WELCOME_MESSAGE]);
  const [inputVal, setInputVal] = useState('');
  const [terminalTheme, setTerminalTheme] = useState<'classic' | 'matrix' | 'cyber' | 'light'>('classic');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of terminal
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [history]);

  // Autofocus input
  const handleTerminalClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const command = inputVal.trim();
      if (!command) return;

      // Add to command history list
      const newCmdHistory = [command, ...cmdHistory];
      setCmdHistory(newCmdHistory);
      setHistoryIndex(-1);

      // Append raw input line to terminal stdout
      const inputLine: TerminalLine = { text: `guest@macbook ~ % ${inputVal}`, type: 'input' };
      const nextHistory = [...history, inputLine];

      processCommand(command, nextHistory);
      setInputVal('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex < cmdHistory.length) {
        setHistoryIndex(nextIndex);
        setInputVal(cmdHistory[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = historyIndex - 1;
      if (nextIndex >= 0) {
        setHistoryIndex(nextIndex);
        setInputVal(cmdHistory[nextIndex]);
      } else {
        setHistoryIndex(-1);
        setInputVal('');
      }
    }
  };

  const processCommand = (commandStr: string, currentHistory: TerminalLine[]) => {
    const parts = commandStr.toLowerCase().split(' ');
    const cmd = parts[0];
    const arg = parts[1];

    let outputLines: TerminalLine[] = [];

    switch (cmd) {
      case 'help':
        outputLines = [
          { text: 'Available commands:', type: 'output' },
          { text: '  about        - Short biography of Ilgaz', type: 'output' },
          { text: '  skills       - Show technical skill summaries', type: 'output' },
          { text: '  projects     - List key personal coding projects', type: 'output' },
          { text: '  neofetch     - Display simulated system specifications', type: 'output' },
          { text: '  theme [val]  - Change console colors: classic, matrix, cyber, light', type: 'output' },
          { text: '  clear        - Clears the terminal display buffer', type: 'output' },
          { text: '  secret       - Trigger a fun secret effect', type: 'output' },
        ];
        break;

      case 'clear':
        setHistory([]);
        return;

      case 'about':
        outputLines = [
          { text: '---------------------------------------------------', type: 'output' },
          { text: 'Ilgaz U. | Full Stack Software Engineer', type: 'output' },
          { text: 'Focused on creating high-performance interactive web apps.', type: 'output' },
          { text: 'Specialties: React, TypeScript, Tailwind, Node.js, and AWS.', type: 'output' },
          { text: 'I believe coding is the fusion of logic and visual art.', type: 'output' },
          { text: '---------------------------------------------------', type: 'output' },
        ];
        break;

      case 'skills':
        outputLines = [
          { text: 'Frontend:  React, Next.js, HTML5, CSS3, Tailwind CSS, GSAP', type: 'output' },
          { text: 'Backend:   Node.js, Express, REST APIs, GraphQL, PostgreSQL', type: 'output' },
          { text: 'DevOps:    Docker, AWS, Git, CI/CD pipelines, Serverless', type: 'output' },
          { text: 'Systems:   TypeScript, JavaScript (ES6+), Python, Go', type: 'output' },
        ];
        break;

      case 'projects':
        outputLines = [
          { text: '1. macOS Portfolio (This Site!)', type: 'output' },
          { text: '   Tech: React, Vite, Zustand, Tailwind CSS v4, GSAP', type: 'output' },
          { text: '2. Glassmorphic CRM Dashboard', type: 'output' },
          { text: '   Tech: React, Charts.js, Node.js, PostgreSQL', type: 'output' },
          { text: '3. Serverless E-Commerce Core API', type: 'output' },
          { text: '   Tech: AWS Lambda, API Gateway, DynamoDB, Python', type: 'output' },
        ];
        break;

      case 'neofetch':
        outputLines = [
          { text: '                    .c,      guest@macbook-pro', type: 'output' },
          { text: '                 ,xNMM.      -----------------', type: 'output' },
          { text: '               .OMMMMo       OS: macOS Sequoia 15.0', type: 'output' },
          { text: '               OMMM0,        Kernel: Darwin 24.0.0', type: 'output' },
          { text: '     .;ldndx0x,    kk        Uptime: 2 mins', type: 'output' },
          { text: '  ,odNMMMMMMMMMNl  ..        Shell: zsh 5.9', type: 'output' },
          { text: ' ;OWMMMMMMMMMMMK;            Resolution: 3024x1964', type: 'output' },
          { text: ' KMMMMMMMMMMMM    .c.        DE: Aqua', type: 'output' },
          { text: ' XMMMMMMMMMMMMN.      ;      WM: Quartz Compositor', type: 'output' },
          { text: ' dMMMMMMMMMMMMMMx.   .d      Terminal: Antigravity Shell', type: 'output' },
          { text: '  lWMMMMMMMMMMMMMNd;,d.      CPU: Apple M3 Ultra', type: 'output' },
          { text: '   .oKMMMMMMMMMMMMMMW.       GPU: Apple M3 Ultra (76-core)', type: 'output' },
          { text: '     .l0NMMMMMMMMMMMM        Memory: 64 GB RAM', type: 'output' },
          { text: '       ..  ;OWMMMMMl         Disk: 120GB / 2TB SSD', type: 'output' },
          { text: '             .OMMM.          Theme: ' + terminalTheme.toUpperCase(), type: 'output' },
        ];
        break;

      case 'theme':
        if (arg === 'matrix' || arg === 'cyber' || arg === 'classic' || arg === 'light') {
          setTerminalTheme(arg);
          outputLines = [{ text: `Terminal theme updated to: ${arg}`, type: 'output' }];
        } else {
          outputLines = [{ text: 'Error: invalid theme. Options are: classic, matrix, cyber, light', type: 'error' }];
        }
        break;

      case 'secret':
        // Trigger confetti!
        confetti({
          particleCount: 150,
          spread: 80,
          angle: 90,
          origin: { y: 0.5 },
        });
        outputLines = [
          { text: '✨ EASTER EGG UNLOCKED! ✨', type: 'output' },
          { text: 'Enjoy a blast of system confetti!', type: 'output' },
        ];
        break;

      default:
        outputLines = [{ text: `zsh: command not found: ${cmd}`, type: 'error' }];
    }

    setHistory([...currentHistory, ...outputLines]);
  };

  const getThemeClass = () => {
    switch (terminalTheme) {
      case 'matrix':
        return 'terminal-matrix';
      case 'cyber':
        return 'terminal-cyber';
      case 'light':
        return 'terminal-light';
      default:
        return 'terminal-classic';
    }
  };

  return (
    <div
      onClick={handleTerminalClick}
      className={`w-full h-full p-4 font-mono text-xs overflow-hidden flex flex-col cursor-text transition-colors duration-200 ${getThemeClass()}`}
    >
      {/* Scrollable history logs */}
      <div ref={containerRef} className="flex-1 overflow-y-auto flex flex-col gap-1 pr-1">
        {history.map((line, idx) => {
          let styleClass = '';
          if (line.type === 'header') {
            styleClass = 'font-bold opacity-80 border-b border-white/5 pb-2 mb-2';
          } else if (line.type === 'error') {
            styleClass = 'text-red-500 font-semibold';
          } else if (line.type === 'input') {
            styleClass = 'opacity-70 font-semibold';
          } else {
            styleClass = 'opacity-90 leading-relaxed';
          }

          return (
            <div key={idx} className={styleClass} style={{ whiteSpace: 'pre-wrap' }}>
              {line.text}
            </div>
          );
        })}
      </div>

      {/* Interactive Command Input Box */}
      <div className="flex items-center shrink-0 border-t border-white/5 pt-2 mt-2">
        <span className="opacity-70 font-bold mr-2">guest@macbook ~ %</span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent border-none outline-none focus:ring-0 focus:outline-none p-0 text-xs font-mono text-inherit"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
      </div>
    </div>
  );
};
