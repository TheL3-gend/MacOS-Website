import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Globe,
  Home,
  Plus,
  RotateCw,
  Search,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ChromeIcon } from '../icons/ChromeIcon';

interface Project {
  id: string;
  name: string;
  url: string;
  desc: string;
  tags: string[];
}

type BidFeedback = {
  type: 'success' | 'error';
  text: string;
};

type FrameLoadStatus = 'idle' | 'loading' | 'loaded' | 'blocked';

interface BrowserTab {
  id: number;
  history: string[];
  historyIndex: number;
  iframeKey: number;
  loadStatus: FrameLoadStatus;
}

const START_URL = 'chrome://start';
const SEARCH_URL_PREFIX = 'chrome://search?q=';
const FRAME_BLOCKED_HOSTS = new Set([
  'accounts.google.com',
  'facebook.com',
  'github.com',
  'instagram.com',
  'linkedin.com',
  'twitter.com',
  'www.facebook.com',
  'www.github.com',
  'www.google.com',
  'www.instagram.com',
  'www.linkedin.com',
  'www.twitter.com',
  'www.youtube.com',
  'x.com',
  'youtube.com',
]);

const PROJECTS: Project[] = [
  {
    id: 'cosmic-nft',
    name: 'Cosmic NFT Market',
    url: 'https://ilgaz.dev/projects/cosmic-nft',
    desc: 'A premium web marketplace for trading cosmic digital assets. Featuring glassmorphism dashboard aesthetics and smooth bidding mechanics.',
    tags: ['React', 'Solidity', 'Tailwind', 'Ethers.js'],
  },
  {
    id: 'ai-code',
    name: 'AI Code Assistant',
    url: 'https://ilgaz.dev/projects/ai-assistant',
    desc: 'An intelligent coding companion IDE that answers natural language requests to refactor, optimize, and document complex codebase patterns.',
    tags: ['Next.js', 'OpenAI API', 'Framer Motion', 'Monaco Editor'],
  },
  {
    id: 'zen-habits',
    name: 'Zen Habits Tracker',
    url: 'https://ilgaz.dev/projects/zen-habits',
    desc: 'A minimal habits planner built using HSL-tailored pastel palettes. Track wellness metrics, schedule intervals, and view weekly summary logs.',
    tags: ['TypeScript', 'React', 'Zustand', 'CSS Gradients'],
  },
];

const normalizeComparableUrl = (url: string) => url.replace(/\/+$/, '');

const getProjectByUrl = (url: string) =>
  PROJECTS.find((project) => normalizeComparableUrl(project.url) === normalizeComparableUrl(url));

const createSearchUrl = (query: string) => `${SEARCH_URL_PREFIX}${encodeURIComponent(query)}`;

const isSearchUrl = (url: string) => url.startsWith(SEARCH_URL_PREFIX);

const getSearchQuery = (url: string) => {
  if (!isSearchUrl(url)) return '';

  try {
    return decodeURIComponent(url.slice(SEARCH_URL_PREFIX.length));
  } catch {
    return url.slice(SEARCH_URL_PREFIX.length);
  }
};

const isGoogleSearchUrl = (url: URL) =>
  url.hostname === 'www.google.com' && url.pathname === '/search';

const normalizeParsedUrl = (url: URL) => {
  if (isGoogleSearchUrl(url)) {
    url.searchParams.set('igu', '1');
  }

  if (url.pathname === '/' && !url.search && !url.hash) {
    return `${url.protocol}//${url.host}`;
  }

  return url.href;
};

const normalizeNavigationInput = (value: string) => {
  const trimmed = value.trim();
  const lowerValue = trimmed.toLowerCase();
  const hasUrlScheme = /^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed);
  const looksLikeLocalUrl = /^(localhost|127(?:\.\d{1,3}){3}|\[::1\])(?::\d+)?(?:[/?#].*)?$/i.test(trimmed);
  const looksLikeDomain = /^[a-z0-9-]+(\.[a-z0-9-]+)+(?:[/:?#].*)?$/i.test(trimmed);

  if (!trimmed || lowerValue === START_URL || lowerValue === 'chrome://newtab') {
    return START_URL;
  }

  if (hasUrlScheme) {
    try {
      const parsedUrl = new URL(trimmed);
      if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
        return normalizeParsedUrl(parsedUrl);
      }
    } catch {
      return createSearchUrl(trimmed);
    }
  }

  if (looksLikeLocalUrl || looksLikeDomain) {
    const protocol = looksLikeLocalUrl ? 'http://' : 'https://';
    try {
      return normalizeParsedUrl(new URL(`${protocol}${trimmed}`));
    } catch {
      return createSearchUrl(trimmed);
    }
  }

  return createSearchUrl(trimmed);
};

const getTabUrl = (tab: BrowserTab) => tab.history[tab.historyIndex] ?? START_URL;

const isExternalUrl = (url: string) => url !== START_URL && !isSearchUrl(url) && !getProjectByUrl(url);

const isKnownFrameBlockedUrl = (url: string) => {
  try {
    const parsedUrl = new URL(url);
    if (isGoogleSearchUrl(parsedUrl) && parsedUrl.searchParams.get('igu') === '1') {
      return false;
    }

    return FRAME_BLOCKED_HOSTS.has(parsedUrl.hostname);
  } catch {
    return false;
  }
};

const getPageTitle = (url: string) => {
  const project = getProjectByUrl(url);
  if (url === START_URL) return 'New Tab';
  if (isSearchUrl(url)) return `Search: ${getSearchQuery(url)}`;
  if (project) return project.name;

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname.includes('google.') && parsedUrl.pathname === '/search') {
      return 'Google Search';
    }

    return parsedUrl.hostname.replace(/^www\./, '') || 'Web Page';
  } catch {
    return 'Web Page';
  }
};

const formatAddressValue = (url: string) => {
  if (url === START_URL) return '';
  if (isSearchUrl(url)) return getSearchQuery(url);
  return url;
};

const getLoadStatusForUrl = (url: string): FrameLoadStatus => {
  if (!isExternalUrl(url)) return 'idle';
  return isKnownFrameBlockedUrl(url) ? 'blocked' : 'loading';
};

const createBrowserTab = (id: number, url = START_URL): BrowserTab => ({
  id,
  history: [url],
  historyIndex: 0,
  iframeKey: 0,
  loadStatus: getLoadStatusForUrl(url),
});

export const ChromeApp: React.FC = () => {
  const [tabs, setTabs] = useState<BrowserTab[]>(() => [createBrowserTab(1)]);
  const [activeTabId, setActiveTabId] = useState(1);
  const [addressDraft, setAddressDraft] = useState('');
  const [nftBid, setNftBid] = useState('1.5');
  const [isBidding, setIsBidding] = useState(false);
  const [bidFeedback, setBidFeedback] = useState<BidFeedback | null>(null);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<Array<{ sender: 'user'; text: string } | { sender: 'ai'; text: string }>>([
    { sender: 'ai', text: 'Hello! I am your AI assistant. Ask me to refactor or design anything!' },
  ]);
  const [habits, setHabits] = useState([
    { id: 1, text: 'Drink 3L of Water', done: false },
    { id: 2, text: '30-minute Meditation', done: false },
    { id: 3, text: 'Read 15 Pages', done: false },
    { id: 4, text: 'Refactor Core Logic', done: false },
  ]);
  const nextTabIdRef = useRef(2);
  const bidTimeoutRef = useRef<number | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);
  const aiTimeoutRefs = useRef<number[]>([]);
  const blockedTimeoutRefs = useRef<Record<number, number>>({});

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId) ?? tabs[0],
    [activeTabId, tabs]
  );
  const activeUrl = activeTab ? getTabUrl(activeTab) : START_URL;
  const activeProject = getProjectByUrl(activeUrl);
  const activeSearchQuery = isSearchUrl(activeUrl) ? getSearchQuery(activeUrl) : '';
  const canGoBack = Boolean(activeTab && activeTab.historyIndex > 0);
  const canGoForward = Boolean(activeTab && activeTab.historyIndex < activeTab.history.length - 1);

  useEffect(() => {
    return () => {
      if (bidTimeoutRef.current !== null) {
        window.clearTimeout(bidTimeoutRef.current);
      }
      if (feedbackTimeoutRef.current !== null) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
      aiTimeoutRefs.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      Object.values(blockedTimeoutRefs.current).forEach((timeoutId) => window.clearTimeout(timeoutId));
      aiTimeoutRefs.current = [];
      blockedTimeoutRefs.current = {};
    };
  }, []);

  const clearBlockedTimeout = (tabId: number) => {
    const timeoutId = blockedTimeoutRefs.current[tabId];
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
      delete blockedTimeoutRefs.current[tabId];
    }
  };

  const scheduleBlockedFallback = (tabId: number, url: string) => {
    clearBlockedTimeout(tabId);
    blockedTimeoutRefs.current[tabId] = window.setTimeout(() => {
      setTabs((currentTabs) =>
        currentTabs.map((tab) => {
          if (tab.id !== tabId || getTabUrl(tab) !== url || tab.loadStatus !== 'loading') {
            return tab;
          }

          return { ...tab, loadStatus: 'blocked' };
        })
      );
      delete blockedTimeoutRefs.current[tabId];
    }, 4_000);
  };

  const navigateTab = (tabId: number, rawAddress: string) => {
    const nextUrl = normalizeNavigationInput(rawAddress);
    const nextLoadStatus = getLoadStatusForUrl(nextUrl);

    setTabs((currentTabs) =>
      currentTabs.map((tab) => {
        if (tab.id !== tabId) return tab;

        const currentUrl = getTabUrl(tab);
        const shouldReload = currentUrl === nextUrl && isExternalUrl(nextUrl);
        const nextHistory = currentUrl === nextUrl
          ? tab.history
          : [...tab.history.slice(0, tab.historyIndex + 1), nextUrl];

        return {
          ...tab,
          history: nextHistory,
          historyIndex: nextHistory.length - 1,
          iframeKey: shouldReload || isExternalUrl(nextUrl) ? tab.iframeKey + 1 : tab.iframeKey,
          loadStatus: nextLoadStatus,
        };
      })
    );
    setAddressDraft(formatAddressValue(nextUrl));

    if (isExternalUrl(nextUrl) && !isKnownFrameBlockedUrl(nextUrl)) {
      scheduleBlockedFallback(tabId, nextUrl);
    } else {
      clearBlockedTimeout(tabId);
    }
  };

  const navigateActiveTab = (rawAddress: string) => {
    if (!activeTab) return;
    navigateTab(activeTab.id, rawAddress);
  };

  const goToHistoryEntry = (direction: -1 | 1) => {
    if (!activeTab) return;

    const nextIndex = activeTab.historyIndex + direction;
    if (nextIndex < 0 || nextIndex >= activeTab.history.length) return;

    const nextUrl = activeTab.history[nextIndex];
    const nextLoadStatus = getLoadStatusForUrl(nextUrl);

    setTabs((currentTabs) =>
      currentTabs.map((tab) =>
        tab.id === activeTab.id
          ? {
              ...tab,
              historyIndex: nextIndex,
              iframeKey: isExternalUrl(nextUrl) ? tab.iframeKey + 1 : tab.iframeKey,
              loadStatus: nextLoadStatus,
            }
          : tab
      )
    );
    setAddressDraft(formatAddressValue(nextUrl));

    if (isExternalUrl(nextUrl) && !isKnownFrameBlockedUrl(nextUrl)) {
      scheduleBlockedFallback(activeTab.id, nextUrl);
    } else {
      clearBlockedTimeout(activeTab.id);
    }
  };

  const reloadActiveTab = () => {
    if (!activeTab) return;
    const nextLoadStatus = getLoadStatusForUrl(activeUrl);

    setTabs((currentTabs) =>
      currentTabs.map((tab) =>
        tab.id === activeTab.id
          ? {
              ...tab,
              iframeKey: isExternalUrl(activeUrl) ? tab.iframeKey + 1 : tab.iframeKey,
              loadStatus: nextLoadStatus,
            }
          : tab
      )
    );

    if (isExternalUrl(activeUrl) && !isKnownFrameBlockedUrl(activeUrl)) {
      scheduleBlockedFallback(activeTab.id, activeUrl);
    }
  };

  const selectTab = (tab: BrowserTab) => {
    setActiveTabId(tab.id);
    setAddressDraft(formatAddressValue(getTabUrl(tab)));
  };

  const addNewTab = () => {
    const nextTab = createBrowserTab(nextTabIdRef.current);
    nextTabIdRef.current += 1;
    setTabs((currentTabs) => [...currentTabs, nextTab]);
    setActiveTabId(nextTab.id);
    setAddressDraft('');
  };

  const closeTab = (tabId: number) => {
    clearBlockedTimeout(tabId);

    if (tabs.length === 1) {
      const nextTab = createBrowserTab(nextTabIdRef.current);
      nextTabIdRef.current += 1;
      setTabs([nextTab]);
      setActiveTabId(nextTab.id);
      setAddressDraft('');
      return;
    }

    const closingIndex = tabs.findIndex((tab) => tab.id === tabId);
    const nextTabs = tabs.filter((tab) => tab.id !== tabId);

    if (activeTabId === tabId) {
      const nextActiveTab = nextTabs[Math.max(0, closingIndex - 1)] ?? nextTabs[0];
      setActiveTabId(nextActiveTab.id);
      setAddressDraft(formatAddressValue(getTabUrl(nextActiveTab)));
    }

    setTabs(nextTabs);
  };

  const handleFrameLoad = (tabId: number, url: string) => {
    clearBlockedTimeout(tabId);
    setTabs((currentTabs) =>
      currentTabs.map((tab) => {
        if (tab.id !== tabId || getTabUrl(tab) !== url) return tab;
        return { ...tab, loadStatus: 'loaded' };
      })
    );
  };

  const handleAddressSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigateActiveTab(addressDraft);
  };

  const handleBidSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isBidding) return;

    const parsedBid = Number(nftBid);
    if (!Number.isFinite(parsedBid) || parsedBid < 1.49) {
      setBidFeedback({ type: 'error', text: 'Enter a bid of at least 1.49 ETH.' });
      return;
    }

    if (bidTimeoutRef.current !== null) {
      window.clearTimeout(bidTimeoutRef.current);
    }
    if (feedbackTimeoutRef.current !== null) {
      window.clearTimeout(feedbackTimeoutRef.current);
    }

    setBidFeedback(null);
    setIsBidding(true);
    bidTimeoutRef.current = window.setTimeout(() => {
      bidTimeoutRef.current = null;
      setIsBidding(false);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });
      setBidFeedback({ type: 'success', text: `Bid of ${parsedBid.toFixed(2)} ETH placed successfully.` });
      feedbackTimeoutRef.current = window.setTimeout(() => {
        feedbackTimeoutRef.current = null;
        setBidFeedback(null);
      }, 3_000);
    }, 1_500);
  };

  const handleAiSend = (event: React.FormEvent) => {
    event.preventDefault();
    if (!aiInput.trim()) return;

    const userMsg = aiInput;
    setAiMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setAiInput('');

    const replyTimeoutId = window.setTimeout(() => {
      aiTimeoutRefs.current = aiTimeoutRefs.current.filter((timeoutId) => timeoutId !== replyTimeoutId);
      let reply = "That sounds interesting! Let's write the code for that using a clean, scalable React component wrapper.";
      if (userMsg.toLowerCase().includes('optimize') || userMsg.toLowerCase().includes('refactor')) {
        reply = 'Optimization suggestion: We can implement memoization (useMemo/useCallback) and virtualize the long lists using a custom window container to avoid unnecessary re-renders.';
      } else if (userMsg.toLowerCase().includes('hello') || userMsg.toLowerCase().includes('hi')) {
        reply = 'Hello there! How can I help you build or code something amazing today?';
      }

      setAiMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
    }, 1_000);
    aiTimeoutRefs.current.push(replyTimeoutId);
  };

  const toggleHabit = (id: number) => {
    setHabits((prev) =>
      prev.map((habit) => (habit.id === id ? { ...habit, done: !habit.done } : habit))
    );
  };

  const completedCount = habits.filter((habit) => habit.done).length;
  const progressPercent = Math.round((completedCount / habits.length) * 100);

  const renderStartPage = () => (
    <div className="chrome-start-page min-h-full flex flex-col items-center px-4 py-10 text-center">
      <ChromeIcon className="h-16 w-16 drop-shadow-sm" />
      <h2 className="mt-4 text-2xl font-semibold text-zinc-950 dark:text-white">Chrome</h2>
      <form
        onSubmit={handleAddressSubmit}
        className="mt-6 flex h-11 w-full max-w-xl items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 text-left shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
        <Search className="h-4 w-4 shrink-0 text-zinc-400" />
        <input
          value={addressDraft}
          onChange={(event) => setAddressDraft(event.target.value)}
          placeholder="Search Google or type a URL"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
          aria-label="Chrome start search"
        />
      </form>

      <div className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
        {PROJECTS.map((project) => (
          <button
            key={project.id}
            type="button"
            data-testid={`chrome-start-bookmark-${project.id}`}
            onClick={() => navigateActiveTab(project.url)}
            className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-left shadow-sm transition hover:border-blue-300 hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/70 dark:hover:border-blue-700 dark:hover:bg-zinc-950"
          >
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 shrink-0 text-blue-500" />
              <span className="truncate text-sm font-bold text-zinc-950 dark:text-white">{project.name}</span>
            </div>
            <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              {project.desc}
            </p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderSearchPage = (query: string) => {
    const normalizedQuery = query.trim().toLowerCase();
    const projectMatches = PROJECTS.filter((project) =>
      [
        project.name,
        project.desc,
        ...project.tags,
      ].some((value) => value.toLowerCase().includes(normalizedQuery))
    );
    const encodedQuery = encodeURIComponent(query);
    const searchLinks = [
      { name: 'Google', url: `https://www.google.com/search?q=${encodedQuery}` },
      { name: 'DuckDuckGo', url: `https://duckduckgo.com/?q=${encodedQuery}` },
      { name: 'Bing', url: `https://www.bing.com/search?q=${encodedQuery}` },
    ];

    return (
      <div
        data-testid="chrome-search-page"
        className="chrome-search-page min-h-full bg-white px-5 py-7 dark:bg-zinc-900"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
              <Search className="h-4 w-4" />
              <span>Search results</span>
            </div>
            <h2 className="mt-2 text-xl font-semibold text-zinc-950 dark:text-white">
              {query}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {searchLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold text-zinc-900 hover:border-blue-300 hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-white dark:hover:border-blue-700"
              >
                <span>{link.name}</span>
                <ExternalLink className="h-4 w-4 text-zinc-400" />
              </a>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {projectMatches.length > 0 ? (
              projectMatches.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => navigateActiveTab(project.url)}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-left shadow-sm transition hover:border-blue-300 hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/70 dark:hover:border-blue-700 dark:hover:bg-zinc-950"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 shrink-0 text-blue-500" />
                    <span className="truncate text-sm font-bold text-zinc-950 dark:text-white">{project.name}</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {project.desc}
                  </p>
                </button>
              ))
            ) : (
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-400">
                No local portfolio matches. Use one of the web search links above, or enter a full website address.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderExternalPage = (tab: BrowserTab, url: string) => (
    <div className="chrome-external-page relative h-full w-full bg-white dark:bg-zinc-950">
      {!isKnownFrameBlockedUrl(url) && (
        <iframe
          key={`${tab.id}-${tab.iframeKey}-${url}`}
          data-testid="chrome-external-frame"
          title="Chrome page"
          src={url}
          sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
          referrerPolicy="no-referrer"
          onLoad={() => handleFrameLoad(tab.id, url)}
          className="h-full w-full border-0 bg-white"
        />
      )}

      {tab.loadStatus === 'loading' && (
        <div
          data-testid="chrome-loading-fallback"
          className="pointer-events-none absolute left-3 top-3 rounded-full border border-zinc-200 bg-white/90 px-3 py-1 text-[11px] font-semibold text-zinc-600 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90 dark:text-zinc-300"
        >
          Loading {getPageTitle(url)}
        </div>
      )}

      {tab.loadStatus === 'blocked' && (
        <div
          data-testid="chrome-blocked-fallback"
          className="absolute inset-0 flex items-center justify-center bg-white/95 p-6 text-center backdrop-blur dark:bg-zinc-950/95"
        >
          <div className="max-w-sm rounded-lg border border-zinc-200 bg-zinc-50 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
            <h3 className="mt-3 text-sm font-bold text-zinc-950 dark:text-white">This page may block embedded browsing</h3>
            <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              Chrome kept the address loaded, but this website only allows viewing in a full browser tab.
            </p>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open in new tab
            </a>
          </div>
        </div>
      )}

      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-3 right-3 inline-flex h-8 items-center gap-2 rounded-full border border-zinc-200 bg-white/90 px-3 text-[11px] font-bold text-zinc-700 shadow-sm backdrop-blur hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/90 dark:text-zinc-200"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Open
      </a>
    </div>
  );

  const renderProjectPage = (project: Project) => (
    <>
      {project.id === 'cosmic-nft' && (
        <div className="chrome-project flex flex-col gap-5 max-w-2xl mx-auto">
          <div className="bg-sky-50 dark:bg-sky-950/20 p-4 rounded-xl border border-sky-200/30 text-xs">
            <span className="font-bold text-sky-700 dark:text-sky-400">Project Overview:</span>
            <p className="mt-1 leading-relaxed text-slate-600 dark:text-zinc-300">{project.desc}</p>
            <div className="chrome-tags flex gap-2 mt-3">
              {project.tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-sky-200/30 text-sky-700 dark:text-sky-300 rounded font-semibold text-[10px]">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="chrome-bid-card rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 p-6 flex flex-col sm:flex-row gap-6 shadow-md items-center">
            <div className="chrome-nft w-40 h-40 rounded-xl bg-gradient-to-tr from-fuchsia-500 via-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-center text-xs p-4 shadow-inner relative overflow-hidden shrink-0">
              <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
              <span className="relative z-10 drop-shadow-md tracking-wider">NEBULA-99 COLLAPSAR</span>
            </div>

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
                    required
                    step="0.01"
                    min="1.49"
                    value={nftBid}
                    onChange={(event) => setNftBid(event.target.value)}
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
              {bidFeedback && (
                <div
                  className={`rounded-lg border px-3 py-2 text-[11px] font-semibold ${
                    bidFeedback.type === 'success'
                      ? 'border-emerald-200/60 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/20 dark:text-emerald-300'
                      : 'border-red-200/60 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300'
                  }`}
                >
                  {bidFeedback.text}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {project.id === 'ai-code' && (
        <div className="chrome-ai-project flex flex-col gap-5 max-w-2xl mx-auto h-[380px]">
          <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200/30 text-xs shrink-0">
            <span className="font-bold text-emerald-700 dark:text-emerald-400">Project Overview:</span>
            <p className="mt-1 leading-relaxed text-slate-600 dark:text-zinc-300">{project.desc}</p>
            <div className="chrome-tags flex gap-2 mt-3">
              {project.tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-emerald-200/30 text-emerald-700 dark:text-emerald-300 rounded font-semibold text-[10px]">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950/50">
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 text-xs">
              {aiMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex flex-col max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white self-end rounded-br-none'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 self-start rounded-bl-none'
                  }`}
                >
                  <span className="leading-relaxed">{message.text}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleAiSend} className="h-12 border-t border-zinc-200 dark:border-zinc-800 px-3 flex items-center gap-2 bg-white dark:bg-zinc-900 shrink-0">
              <input
                type="text"
                value={aiInput}
                onChange={(event) => setAiInput(event.target.value)}
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

      {project.id === 'zen-habits' && (
        <div className="chrome-project flex flex-col gap-5 max-w-xl mx-auto">
          <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200/30 text-xs">
            <span className="font-bold text-amber-700 dark:text-amber-400">Project Overview:</span>
            <p className="mt-1 leading-relaxed text-slate-600 dark:text-zinc-300">{project.desc}</p>
            <div className="chrome-tags flex gap-2 mt-3">
              {project.tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-amber-200/30 text-amber-700 dark:text-amber-300 rounded font-semibold text-[10px]">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 p-5 flex flex-col gap-4 shadow-sm">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-zinc-950 dark:text-white text-base">Zen Habits</h3>
              <span className="text-[11px] px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/30 text-indigo-600 dark:text-indigo-400 rounded-full font-bold">
                {progressPercent}% Complete
              </span>
            </div>

            <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-400 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex flex-col gap-2.5 mt-2">
              {habits.map((habit) => (
                <button
                  key={habit.id}
                  onClick={() => toggleHabit(habit.id)}
                  className="flex items-center gap-3 w-full text-left p-2.5 rounded-lg border border-zinc-200/40 dark:border-zinc-800/30 bg-white dark:bg-zinc-900 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/60 transition-all text-xs"
                >
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                      habit.done
                        ? 'bg-teal-500 border-teal-500 text-white'
                        : 'border-zinc-300 dark:border-zinc-700'
                    }`}
                  >
                    {habit.done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span className={habit.done ? 'line-through opacity-50' : 'font-semibold'}>
                    {habit.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="chrome-app w-full h-full flex flex-col bg-zinc-100 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 select-none">
      <div className="chrome-tabs flex items-end gap-1 bg-slate-200/80 px-3 pt-2 dark:bg-zinc-950 shrink-0 text-[11px] font-medium">
        {tabs.map((tab) => {
          const tabUrl = getTabUrl(tab);
          const isActive = tab.id === activeTabId;

          return (
            <div
              key={tab.id}
              className={`chrome-tab flex h-8 min-w-0 max-w-[190px] flex-1 items-center rounded-t-lg border-x border-t transition ${
                isActive
                  ? 'border-slate-300/70 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white'
                  : 'border-transparent bg-slate-100/50 text-slate-500 hover:bg-slate-100 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:bg-zinc-900/80'
              }`}
            >
              <button
                type="button"
                onClick={() => selectTab(tab)}
                className="flex min-w-0 flex-1 items-center gap-1.5 px-3 py-2 text-left"
                aria-label={`Activate tab ${getPageTitle(tabUrl)}`}
              >
                {tabUrl === START_URL ? (
                  <ChromeIcon className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <Globe className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                )}
                <span className="truncate">{getPageTitle(tabUrl)}</span>
              </button>
              <button
                type="button"
                onClick={() => closeTab(tab.id)}
                className="mr-1 rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-white"
                aria-label={`Close ${getPageTitle(tabUrl)}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
        <button
          type="button"
          onClick={addNewTab}
          className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-500 hover:bg-white/70 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-white"
          aria-label="New tab"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="chrome-toolbar h-11 px-3 bg-white dark:bg-zinc-900 border-b border-slate-300/50 dark:border-zinc-800/80 flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1 text-slate-500">
          <button
            type="button"
            onClick={() => goToHistoryEntry(-1)}
            disabled={!canGoBack}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => goToHistoryEntry(1)}
            disabled={!canGoForward}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Forward"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={reloadActiveTab}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full"
            aria-label="Reload"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => navigateActiveTab(START_URL)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full"
            aria-label="Home"
          >
            <Home className="w-3.5 h-3.5" />
          </button>
        </div>

        <form
          onSubmit={handleAddressSubmit}
          className="chrome-address flex-1 h-8 bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-full flex items-center px-3 text-xs gap-2 text-slate-600 dark:text-zinc-300"
        >
          <Globe className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          <input
            data-testid="chrome-address-input"
            value={addressDraft}
            onChange={(event) => setAddressDraft(event.target.value)}
            placeholder="Search Google or type a URL"
            className="min-w-0 flex-1 bg-transparent outline-none select-text placeholder:text-slate-400"
            aria-label="Chrome address bar"
          />
        </form>
      </div>

      <div
        data-testid="chrome-bookmarks-bar"
        className="chrome-bookmarks-bar flex h-8 shrink-0 items-center gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 text-[11px] dark:border-zinc-800 dark:bg-zinc-900"
      >
        {PROJECTS.map((project) => (
          <button
            key={project.id}
            type="button"
            data-testid={`chrome-bookmark-${project.id}`}
            onClick={() => navigateActiveTab(project.url)}
            className="flex h-6 shrink-0 items-center gap-1.5 rounded-md px-2 text-slate-600 hover:bg-slate-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            <Globe className="h-3 w-3 text-blue-500" />
            <span>{project.name}</span>
          </button>
        ))}
      </div>

      <div className="chrome-content flex-1 overflow-y-auto bg-white dark:bg-zinc-900">
        {activeUrl === START_URL && renderStartPage()}
        {activeSearchQuery && renderSearchPage(activeSearchQuery)}
        {activeProject && (
          <div className="p-5">
            {renderProjectPage(activeProject)}
          </div>
        )}
        {activeTab && isExternalUrl(activeUrl) && renderExternalPage(activeTab, activeUrl)}
      </div>
    </div>
  );
};
