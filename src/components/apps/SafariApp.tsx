import React, { useState } from 'react';
import { RotateCw, Globe, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Project {
  id: string;
  name: string;
  url: string;
  desc: string;
  tags: string[];
}

export const SafariApp: React.FC = () => {
  const [activeProjIndex, setActiveProjIndex] = useState(0);
  const [searchUrl, setSearchUrl] = useState('https://ilgaz.dev/projects/cosmic-nft');
  const [nftBid, setNftBid] = useState('1.5');
  const [isBidding, setIsBidding] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: 'Hello! I am your AI assistant. Ask me to refactor or design anything!' }
  ]);
  const [habits, setHabits] = useState([
    { id: 1, text: 'Drink 3L of Water', done: false },
    { id: 2, text: '30-minute Meditation', done: false },
    { id: 3, text: 'Read 15 Pages', done: false },
    { id: 4, text: 'Refactor Core Logic', done: false }
  ]);

  const projects: Project[] = [
    {
      id: 'cosmic-nft',
      name: 'Cosmic NFT Market',
      url: 'https://ilgaz.dev/projects/cosmic-nft',
      desc: 'A premium web marketplace for trading cosmic digital assets. Featuring glassmorphism dashboard aesthetics and smooth bidding mechanics.',
      tags: ['React', 'Solidity', 'Tailwind', 'Ethers.js']
    },
    {
      id: 'ai-code',
      name: 'AI Code Assistant',
      url: 'https://ilgaz.dev/projects/ai-assistant',
      desc: 'An intelligent coding companion IDE that answers natural language requests to refactor, optimize, and document complex codebase patterns.',
      tags: ['Next.js', 'OpenAI API', 'Framer Motion', 'Monaco Editor']
    },
    {
      id: 'zen-habits',
      name: 'Zen Habits Tracker',
      url: 'https://ilgaz.dev/projects/zen-habits',
      desc: 'A minimal habits planner built using HSL-tailored pastel palettes. Track wellness metrics, schedule intervals, and view weekly summary logs.',
      tags: ['TypeScript', 'React', 'Zustand', 'CSS Gradients']
    }
  ];

  const handleProjChange = (idx: number) => {
    setActiveProjIndex(idx);
    setSearchUrl(projects[idx].url);
  };

  const handleNavClick = (direction: 'prev' | 'next') => {
    let nextIdx = activeProjIndex;
    if (direction === 'prev' && activeProjIndex > 0) {
      nextIdx = activeProjIndex - 1;
    } else if (direction === 'next' && activeProjIndex < projects.length - 1) {
      nextIdx = activeProjIndex + 1;
    }
    if (nextIdx !== activeProjIndex) {
      handleProjChange(nextIdx);
    }
  };

  // Cosmic NFT Bidding Simulation
  const handleBidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isBidding) return;
    setIsBidding(true);
    setTimeout(() => {
      setIsBidding(false);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });
      alert(`Bid of ${nftBid} ETH placed successfully!`);
    }, 1500);
  };

  // AI Assistant Chat Simulation
  const handleAiSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const userMsg = aiInput;
    setAiMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setAiInput('');

    setTimeout(() => {
      let reply = "That sounds interesting! Let's write the code for that using a clean, scalable React component wrapper.";
      if (userMsg.toLowerCase().includes('optimize') || userMsg.toLowerCase().includes('refactor')) {
        reply = "Optimization suggestion: We can implement memoization (useMemo/useCallback) and virtualize the long lists using a custom window container to avoid unnecessary re-renders.";
      } else if (userMsg.toLowerCase().includes('hello') || userMsg.toLowerCase().includes('hi')) {
        reply = "Hello there! How can I help you build or code something amazing today?";
      }

      setAiMessages(prev => [...prev, { sender: 'ai', text: reply }]);
    }, 1000);
  };

  // Zen Habits Toggle
  const toggleHabit = (id: number) => {
    setHabits(prev =>
      prev.map(h => (h.id === id ? { ...h, done: !h.done } : h))
    );
  };

  const completedCount = habits.filter(h => h.done).length;
  const progressPercent = Math.round((completedCount / habits.length) * 100);

  return (
    <div className="w-full h-full flex flex-col bg-zinc-100 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 select-none">
      {/* Browser Navbar Header */}
      <div className="h-11 px-3 bg-slate-200/50 dark:bg-zinc-900/50 border-b border-slate-300/40 dark:border-zinc-800/60 flex items-center gap-3 shrink-0">
        {/* Navigation Buttons */}
        <div className="flex items-center gap-1 text-slate-500">
          <button
            onClick={() => handleNavClick('prev')}
            disabled={activeProjIndex === 0}
            className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleNavClick('next')}
            disabled={activeProjIndex === projects.length - 1}
            className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded">
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Address Input Bar */}
        <div className="flex-1 max-w-lg mx-auto h-7 bg-white dark:bg-zinc-900 border border-slate-300/50 dark:border-zinc-800 rounded-lg flex items-center justify-center px-3 text-xs gap-1.5 text-slate-600 dark:text-zinc-400">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <span className="truncate select-text">{searchUrl}</span>
        </div>
        
        <div className="w-16" /> {/* Spacer */}
      </div>

      {/* Tabs Menu */}
      <div className="flex items-end px-3 gap-1 bg-slate-200/20 dark:bg-zinc-900/10 border-b border-slate-300/20 dark:border-zinc-900 shrink-0 text-[11px] h-8 font-medium">
        {projects.map((proj, idx) => (
          <button
            key={proj.id}
            onClick={() => handleProjChange(idx)}
            className={`px-3 py-1 rounded-t-lg border-t border-x flex items-center gap-1.5 transition-all max-w-[140px] truncate ${
              activeProjIndex === idx
                ? 'bg-white dark:bg-zinc-900 border-slate-300/40 dark:border-zinc-800/80 text-blue-600 dark:text-sky-400 font-semibold'
                : 'bg-slate-200/40 dark:bg-zinc-900/20 border-transparent text-slate-500 hover:bg-slate-200/80 dark:hover:bg-zinc-900/40'
            }`}
          >
            <Globe className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{proj.name}</span>
          </button>
        ))}
      </div>

      {/* Safari Window View Area */}
      <div className="flex-1 overflow-y-auto p-5 bg-white dark:bg-zinc-900">
        
        {/* Render Interactive Mockups */}
        {projects[activeProjIndex].id === 'cosmic-nft' && (
          <div className="flex flex-col gap-5 max-w-2xl mx-auto">
            {/* Description Info Banner */}
            <div className="bg-sky-50 dark:bg-sky-950/20 p-4 rounded-xl border border-sky-200/30 text-xs">
              <span className="font-bold text-sky-700 dark:text-sky-400">Project Overview:</span>
              <p className="mt-1 leading-relaxed text-slate-600 dark:text-zinc-300">{projects[0].desc}</p>
              <div className="flex gap-2 mt-3">
                {projects[0].tags.map(t => (
                  <span key={t} className="px-2 py-0.5 bg-sky-200/30 text-sky-700 dark:text-sky-300 rounded font-semibold text-[10px]">{t}</span>
                ))}
              </div>
            </div>

            {/* Interactive Bid UI Card */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 p-6 flex flex-col sm:flex-row gap-6 shadow-md items-center">
              {/* NFT Image Mockup */}
              <div className="w-40 h-40 rounded-xl bg-gradient-to-tr from-fuchsia-500 via-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-center text-xs p-4 shadow-inner relative overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
                <span className="relative z-10 drop-shadow-md tracking-wider">NEBULA-99 COLLAPSAR</span>
              </div>

              {/* Bidding interaction */}
              <div className="flex-1 w-full flex flex-col gap-4">
                <div>
                  <h3 className="font-bold text-base text-zinc-950 dark:text-white">Nebula-99 Collapsar NFT</h3>
                  <span className="text-xs text-indigo-500 font-semibold">Artist: CosmosExplorer</span>
                </div>

                <div className="flex justify-between border-t border-zinc-200 dark:border-zinc-800 pt-3 text-xs">
                  <div className="flex flex-col">
                    <span className="opacity-50">Current Bid</span>
                    <span className="font-bold text-zinc-950 dark:text-white text-base">1.48 ETH</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="opacity-50">Ending In</span>
                    <span className="font-bold text-zinc-950 dark:text-white">12h 43m 11s</span>
                  </div>
                </div>

                <form onSubmit={handleBidSubmit} className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.01"
                      min="1.49"
                      value={nftBid}
                      onChange={(e) => setNftBid(e.target.value)}
                      className="w-full h-9 px-3 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs font-semibold focus:outline-none"
                    />
                    <span className="absolute right-3 top-2.5 text-[10px] font-bold text-indigo-500">ETH</span>
                  </div>
                  <button
                    type="submit"
                    disabled={isBidding}
                    className="px-5 h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-all active:scale-97 disabled:opacity-60"
                  >
                    {isBidding ? 'Placing...' : 'Place Bid'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* AI Assistant Chat Interactive Mockup */}
        {projects[activeProjIndex].id === 'ai-code' && (
          <div className="flex flex-col gap-5 max-w-2xl mx-auto h-[380px]">
            {/* Overview banner */}
            <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200/30 text-xs shrink-0">
              <span className="font-bold text-emerald-700 dark:text-emerald-400">Project Overview:</span>
              <p className="mt-1 leading-relaxed text-slate-600 dark:text-zinc-300">{projects[1].desc}</p>
              <div className="flex gap-2 mt-3">
                {projects[1].tags.map(t => (
                  <span key={t} className="px-2 py-0.5 bg-emerald-200/30 text-emerald-700 dark:text-emerald-300 rounded font-semibold text-[10px]">{t}</span>
                ))}
              </div>
            </div>

            {/* Chat Sandbox */}
            <div className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950/50">
              {/* Message scroll log */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 text-xs">
                {aiMessages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col max-w-[80%] rounded-2xl px-4 py-2 ${
                      m.sender === 'user'
                        ? 'bg-blue-600 text-white self-end rounded-br-none'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 self-start rounded-bl-none'
                    }`}
                  >
                    <span className="leading-relaxed">{m.text}</span>
                  </div>
                ))}
              </div>

              {/* Chat Send Form */}
              <form onSubmit={handleAiSend} className="h-12 border-t border-zinc-200 dark:border-zinc-800 px-3 flex items-center gap-2 bg-white dark:bg-zinc-900 shrink-0">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Ask the AI Code Assistant (e.g. 'Optimize loops')"
                  className="flex-1 bg-transparent border-none outline-none focus:ring-0 focus:outline-none text-xs text-inherit"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] transition-all active:scale-97"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Zen Habits Tracker Interactive Mockup */}
        {projects[activeProjIndex].id === 'zen-habits' && (
          <div className="flex flex-col gap-5 max-w-xl mx-auto">
            {/* Overview banner */}
            <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200/30 text-xs">
              <span className="font-bold text-amber-700 dark:text-amber-400">Project Overview:</span>
              <p className="mt-1 leading-relaxed text-slate-600 dark:text-zinc-300">{projects[2].desc}</p>
              <div className="flex gap-2 mt-3">
                {projects[2].tags.map(t => (
                  <span key={t} className="px-2 py-0.5 bg-amber-200/30 text-amber-700 dark:text-amber-300 rounded font-semibold text-[10px]">{t}</span>
                ))}
              </div>
            </div>

            {/* Checklist dashboard box */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 p-5 flex flex-col gap-4 shadow-sm">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-zinc-950 dark:text-white text-base">Zen Habits</h3>
                <span className="text-[11px] px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/30 text-indigo-600 dark:text-indigo-400 rounded-full font-bold">
                  {progressPercent}% Complete
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-400 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Habits items list */}
              <div className="flex flex-col gap-2.5 mt-2">
                {habits.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => toggleHabit(h.id)}
                    className="flex items-center gap-3 w-full text-left p-2.5 rounded-lg border border-zinc-200/40 dark:border-zinc-800/30 bg-white dark:bg-zinc-900 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/60 transition-all text-xs"
                  >
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        h.done
                          ? 'bg-teal-500 border-teal-500 text-white'
                          : 'border-zinc-300 dark:border-zinc-700'
                      }`}
                    >
                      {h.done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span className={h.done ? 'line-through opacity-50' : 'font-semibold'}>
                      {h.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
