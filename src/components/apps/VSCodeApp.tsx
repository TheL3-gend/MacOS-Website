import React, { useCallback, useMemo, useRef, useState } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  FileCode2,
  Files,
  Folder,
  FolderOpen,
  GitBranch,
  Package,
  Play,
  Plus,
  RotateCcw,
  Save,
  Search,
  Settings,
  SquarePen,
  Terminal,
  Trash2,
  X,
} from 'lucide-react';
import {
  addWorkspaceFile,
  deleteWorkspaceNode,
  findWorkspaceFile,
  flattenWorkspaceFiles,
  getLanguageFromPath,
  loadWorkspaceState,
  markWorkspaceCommitted,
  markWorkspaceSaved,
  normalizeWorkspacePath,
  persistWorkspaceState,
  renameWorkspaceNode,
  resetWorkspaceState,
  resetWorkspaceToGit,
  setWorkspaceFolderExpanded,
  updateWorkspaceFileContent,
  workspaceHasPath,
  type WorkspaceCommit,
  type WorkspaceFile,
  type WorkspaceFolder,
  type WorkspaceLanguage,
  type WorkspaceNode,
  type WorkspaceState,
} from '../../lib/vscodeWorkspace';
import {
  consumeOpenDesktopFileRequest,
  loadVirtualDesktopFiles,
  saveFileToVirtualDesktop,
  VIRTUAL_DESKTOP_OPEN_EVENT,
  type VirtualDesktopFile,
  type VirtualDesktopOpenRequest,
} from '../../lib/virtualDesktopFiles';

type ActivityView = 'explorer' | 'search' | 'source' | 'extensions' | 'settings';

type ExtensionId = 'prettier' | 'live-preview' | 'gitlens' | 'material-icons';

interface SearchResult {
  id: string;
  filePath: string;
  fileName: string;
  lineNumber: number;
  lineText: string;
}

interface GitChange {
  file: WorkspaceFile;
  status: 'M' | 'U';
}

interface WorkspaceTreeNodeProps {
  node: WorkspaceNode;
  depth: number;
  activeFilePath: string;
  dirtyPaths: Set<string>;
  gitChangePaths: Set<string>;
  iconThemeEnabled: boolean;
  onDeleteNode: (node: WorkspaceNode) => void;
  onOpenFile: (filePath: string) => void;
  onRenameNode: (node: WorkspaceNode) => void;
  onToggleFolder: (folder: WorkspaceFolder) => void;
}

interface ExtensionDefinition {
  id: ExtensionId;
  name: string;
  publisher: string;
  description: string;
  category: string;
}

type RunOutput =
  | {
      kind: 'idle';
      title: string;
      lines: string[];
    }
  | {
      kind: 'console';
      title: string;
      lines: string[];
      isError?: boolean;
    }
  | {
      kind: 'preview';
      title: string;
      srcDoc: string;
    };

const EXTENSION_STORAGE_KEY = 'macos_vscode_extensions_v1';

const DEFAULT_EXTENSION_IDS: ExtensionId[] = ['live-preview', 'gitlens'];

const EXTENSIONS: ExtensionDefinition[] = [
  {
    id: 'prettier',
    name: 'Prettier Formatter',
    publisher: 'esbenp',
    description: 'Adds one-click formatting for JSON, CSS, HTML, Markdown, and script files.',
    category: 'Formatting',
  },
  {
    id: 'live-preview',
    name: 'Live Preview',
    publisher: 'ms-vscode',
    description: 'Runs HTML, CSS, Markdown, and JavaScript files in the built-in preview panel.',
    category: 'Runtime',
  },
  {
    id: 'gitlens',
    name: 'GitLens',
    publisher: 'gitkraken',
    description: 'Shows virtual commit history and richer source control context.',
    category: 'Source Control',
  },
  {
    id: 'material-icons',
    name: 'Material Icon Theme',
    publisher: 'pkief',
    description: 'Adds language-colored file icons in the Explorer and tab strip.',
    category: 'Theme',
  },
];

const LANGUAGE_LABELS: Record<WorkspaceLanguage, string> = {
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  json: 'JSON',
  css: 'CSS',
  markdown: 'Markdown',
  html: 'HTML',
  plaintext: 'Plain Text',
};

const loadEnabledExtensionIds = (): ExtensionId[] => {
  if (typeof window === 'undefined') return DEFAULT_EXTENSION_IDS;

  try {
    const stored = window.localStorage.getItem(EXTENSION_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as ExtensionId[]) : DEFAULT_EXTENSION_IDS;
  } catch {
    return DEFAULT_EXTENSION_IDS;
  }
};

const persistEnabledExtensionIds = (ids: ExtensionId[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(EXTENSION_STORAGE_KEY, JSON.stringify(ids));
};

const getNextPathForRename = (currentPath: string, nextName: string) => {
  const cleanName = nextName.trim().replaceAll('/', '').replaceAll('\\', '');
  const parentPath = currentPath.split('/').slice(0, -1).join('/');
  return parentPath ? `${parentPath}/${cleanName}` : cleanName;
};

const isPathWithin = (path: string, containerPath: string) =>
  path === containerPath || path.startsWith(`${containerPath}/`);

const formatSavedTime = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

const formatCommitTime = (timestamp: number) =>
  new Date(timestamp).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const markdownToHtml = (markdown: string) =>
  markdown
    .split('\n')
    .map((line) => {
      const safeLine = escapeHtml(line);
      if (safeLine.startsWith('# ')) return `<h1>${safeLine.slice(2)}</h1>`;
      if (safeLine.startsWith('## ')) return `<h2>${safeLine.slice(3)}</h2>`;
      if (safeLine.startsWith('- ')) return `<li>${safeLine.slice(2)}</li>`;
      if (!safeLine.trim()) return '<br />';
      return `<p>${safeLine}</p>`;
    })
    .join('\n');

const createPreviewDocument = (file: WorkspaceFile) => {
  if (file.language === 'html') return file.content;

  if (file.language === 'css') {
    return `<!doctype html><html><head><style>${file.content}</style></head><body><main><h1>CSS Preview</h1><p>Edit the stylesheet and run again.</p><button>Sample Button</button></main></body></html>`;
  }

  if (file.language === 'markdown') {
    return `<!doctype html><html><head><style>body{font-family:system-ui,sans-serif;line-height:1.6;margin:32px;color:#111827}h1,h2{color:#0f172a}li{margin:6px 0}</style></head><body>${markdownToHtml(file.content)}</body></html>`;
  }

  return `<!doctype html><html><body><pre>${escapeHtml(file.content)}</pre></body></html>`;
};

const formatContent = (content: string, language: WorkspaceLanguage) => {
  if (language === 'json') {
    try {
      return `${JSON.stringify(JSON.parse(content), null, 2)}\n`;
    } catch {
      return content;
    }
  }

  if (language === 'markdown') {
    return `${content
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n')
      .trim()}\n`;
  }

  if (language === 'css' || language === 'html') {
    return `${content
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()}\n`;
  }

  return `${content
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()}\n`;
};

const getFileIconColor = (file: WorkspaceFile, iconThemeEnabled: boolean) => {
  if (!iconThemeEnabled) return 'text-indigo-400';

  switch (file.language) {
    case 'typescript':
      return 'text-blue-400';
    case 'javascript':
      return 'text-yellow-300';
    case 'json':
      return 'text-amber-300';
    case 'css':
      return 'text-sky-400';
    case 'html':
      return 'text-orange-400';
    case 'markdown':
      return 'text-emerald-400';
    default:
      return 'text-zinc-400';
  }
};

const WorkspaceTreeNode: React.FC<WorkspaceTreeNodeProps> = ({
  node,
  depth,
  activeFilePath,
  dirtyPaths,
  gitChangePaths,
  iconThemeEnabled,
  onDeleteNode,
  onOpenFile,
  onRenameNode,
  onToggleFolder,
}) => {
  const indentStyle = { paddingLeft: `${8 + depth * 12}px` };

  if (node.type === 'folder') {
    const isRoot = node.path === '';

    return (
      <div>
        <div className="group flex items-center pr-1 text-zinc-300">
          <button
            type="button"
            onClick={() => onToggleFolder(node)}
            className="flex min-w-0 flex-1 items-center gap-1.5 py-1 text-left text-[12px] font-semibold uppercase tracking-[0.02em] hover:bg-zinc-800/70"
            style={indentStyle}
            aria-label={`${node.expanded ? 'Collapse' : 'Expand'} ${node.name}`}
          >
            {node.expanded ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
            )}
            {node.expanded ? (
              <FolderOpen className="h-3.5 w-3.5 shrink-0 text-sky-500" />
            ) : (
              <Folder className="h-3.5 w-3.5 shrink-0 text-sky-500" />
            )}
            <span className="truncate">{node.name}</span>
          </button>
          {!isRoot && (
            <div className="flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onRenameNode(node);
                }}
                className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                aria-label={`Rename ${node.name}`}
              >
                <SquarePen className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteNode(node);
                }}
                className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-red-300"
                aria-label={`Delete ${node.name}`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
        {node.expanded && (
          <div>
            {node.children.map((child) => (
              <WorkspaceTreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                activeFilePath={activeFilePath}
                dirtyPaths={dirtyPaths}
                gitChangePaths={gitChangePaths}
                iconThemeEnabled={iconThemeEnabled}
                onDeleteNode={onDeleteNode}
                onOpenFile={onOpenFile}
                onRenameNode={onRenameNode}
                onToggleFolder={onToggleFolder}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isActive = activeFilePath === node.path;
  const isDirty = dirtyPaths.has(node.path);
  const hasGitChange = gitChangePaths.has(node.path);

  return (
    <div className="group flex items-center pr-1">
      <button
        type="button"
        onClick={() => onOpenFile(node.path)}
        className={`flex min-w-0 flex-1 items-center gap-1.5 py-1 text-left text-[12px] transition-colors ${
          isActive
            ? 'bg-sky-500/15 text-sky-300'
            : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100'
        }`}
        style={indentStyle}
        aria-label={`Open ${node.path}`}
      >
        <FileCode2 className={`h-3.5 w-3.5 shrink-0 ${getFileIconColor(node, iconThemeEnabled)}`} />
        <span className="truncate">{node.name}</span>
        {hasGitChange && <span className="ml-auto text-[10px] font-bold text-emerald-300">M</span>}
        {isDirty && <span className="pr-1 text-amber-300">*</span>}
      </button>
      <div className="flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRenameNode(node);
          }}
          className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
          aria-label={`Rename ${node.name}`}
        >
          <SquarePen className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDeleteNode(node);
          }}
          className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-red-300"
          aria-label={`Delete ${node.name}`}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};

export const VSCodeApp: React.FC = () => {
  const [workspace, setWorkspace] = useState<WorkspaceState>(() => loadWorkspaceState());
  const [openTabs, setOpenTabs] = useState<string[]>(() => [loadWorkspaceState().activeFilePath]);
  const [activeView, setActiveView] = useState<ActivityView>('explorer');
  const [searchQuery, setSearchQuery] = useState('');
  const [lineColumn, setLineColumn] = useState({ line: 1, column: 1 });
  const [saveFlash, setSaveFlash] = useState(false);
  const [desktopSaveFlash, setDesktopSaveFlash] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [enabledExtensionIds, setEnabledExtensionIds] = useState<ExtensionId[]>(() =>
    loadEnabledExtensionIds()
  );
  const [runOutput, setRunOutput] = useState<RunOutput>({
    kind: 'idle',
    title: 'Run',
    lines: ['Run a JavaScript, HTML, CSS, or Markdown file to see output here.'],
  });
  const [isRunPanelOpen, setIsRunPanelOpen] = useState(false);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const saveFlashTimeoutRef = useRef<number | null>(null);
  const desktopFlashTimeoutRef = useRef<number | null>(null);

  const enabledExtensions = useMemo(() => new Set(enabledExtensionIds), [enabledExtensionIds]);
  const allFiles = useMemo(
    () => flattenWorkspaceFiles(workspace.root.children),
    [workspace.root.children]
  );
  const activeFile = useMemo(
    () =>
      findWorkspaceFile(workspace.root.children, workspace.activeFilePath) ??
      allFiles[0] ??
      null,
    [allFiles, workspace.activeFilePath, workspace.root.children]
  );
  const dirtyPaths = useMemo(
    () =>
      new Set(
        allFiles
          .filter((file) => file.content !== file.savedContent)
          .map((file) => file.path)
      ),
    [allFiles]
  );
  const gitChanges = useMemo<GitChange[]>(
    () =>
      allFiles
        .filter((file) => file.gitContent === null || file.content !== file.gitContent)
        .map((file) => ({
          file,
          status: file.gitContent === null ? 'U' : 'M',
        })),
    [allFiles]
  );
  const gitChangePaths = useMemo(
    () => new Set(gitChanges.map((change) => change.file.path)),
    [gitChanges]
  );
  const visibleTabs = useMemo(
    () =>
      openTabs
        .map((path) => findWorkspaceFile(workspace.root.children, path))
        .filter((file): file is WorkspaceFile => Boolean(file)),
    [openTabs, workspace.root.children]
  );
  const hasDirtyFiles = dirtyPaths.size > 0;
  const iconThemeEnabled = enabledExtensions.has('material-icons');

  const searchResults = useMemo<SearchResult[]>(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    const results: SearchResult[] = [];

    allFiles.forEach((file) => {
      if (file.path.toLowerCase().includes(query)) {
        results.push({
          id: `${file.path}:filename`,
          filePath: file.path,
          fileName: file.name,
          lineNumber: 1,
          lineText: file.path,
        });
      }

      file.content.split('\n').forEach((line, index) => {
        if (line.toLowerCase().includes(query)) {
          results.push({
            id: `${file.path}:${index + 1}:${line}`,
            filePath: file.path,
            fileName: file.name,
            lineNumber: index + 1,
            lineText: line.trim() || ' ',
          });
        }
      });
    });

    return results.slice(0, 80);
  }, [allFiles, searchQuery]);

  const openFile = useCallback((filePath: string) => {
    setWorkspace((current) => ({ ...current, activeFilePath: filePath }));
    setOpenTabs((current) => (current.includes(filePath) ? current : [...current, filePath]));
  }, []);

  const importDesktopFile = useCallback((desktopFile: VirtualDesktopFile) => {
    const filePath = `desktop-${desktopFile.name}`;

    setWorkspace((current) => {
      const childrenWithFile = workspaceHasPath(current.root.children, filePath)
        ? current.root.children
        : addWorkspaceFile(current.root.children, filePath);
      const nextState: WorkspaceState = {
        ...current,
        activeFilePath: filePath,
        root: {
          ...current.root,
          children: updateWorkspaceFileContent(childrenWithFile, filePath, desktopFile.content),
        },
      };

      persistWorkspaceState(nextState);
      return nextState;
    });
    setOpenTabs((current) => (current.includes(filePath) ? current : [...current, filePath]));
  }, []);

  React.useEffect(() => {
    const handleOpenRequest = (event: Event) => {
      const customEvent = event as CustomEvent<VirtualDesktopOpenRequest>;
      const fileId = customEvent.detail?.fileId;
      const file = loadVirtualDesktopFiles().find((candidate) => candidate.id === fileId);
      if (file) importDesktopFile(file);
    };

    let pendingOpenTimeout: number | null = null;
    const pendingRequest = consumeOpenDesktopFileRequest();
    if (pendingRequest) {
      const file = loadVirtualDesktopFiles().find((candidate) => candidate.id === pendingRequest.fileId);
      if (file) {
        pendingOpenTimeout = window.setTimeout(() => importDesktopFile(file), 0);
      }
    }

    window.addEventListener(VIRTUAL_DESKTOP_OPEN_EVENT, handleOpenRequest);
    return () => {
      window.removeEventListener(VIRTUAL_DESKTOP_OPEN_EVENT, handleOpenRequest);
      if (pendingOpenTimeout !== null) {
        window.clearTimeout(pendingOpenTimeout);
      }
    };
  }, [importDesktopFile]);

  const saveWorkspace = useCallback(() => {
    setWorkspace((current) => {
      const savedState: WorkspaceState = {
        ...current,
        root: {
          ...current.root,
          children: markWorkspaceSaved(current.root.children),
        },
        lastSavedAt: Date.now(),
      };

      persistWorkspaceState(savedState);
      return savedState;
    });

    setSaveFlash(true);
    if (saveFlashTimeoutRef.current !== null) {
      window.clearTimeout(saveFlashTimeoutRef.current);
    }
    saveFlashTimeoutRef.current = window.setTimeout(() => setSaveFlash(false), 900);
  }, []);

  React.useEffect(() => {
    const handleSaveShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        saveWorkspace();
      }
    };

    window.addEventListener('keydown', handleSaveShortcut, true);
    return () => {
      window.removeEventListener('keydown', handleSaveShortcut, true);
      if (saveFlashTimeoutRef.current !== null) {
        window.clearTimeout(saveFlashTimeoutRef.current);
      }
      if (desktopFlashTimeoutRef.current !== null) {
        window.clearTimeout(desktopFlashTimeoutRef.current);
      }
    };
  }, [saveWorkspace]);

  const handleEditorMount: OnMount = (editorInstance, monacoInstance) => {
    editorRef.current = editorInstance;
    monacoInstance.languages.typescript.typescriptDefaults.setCompilerOptions({
      allowNonTsExtensions: true,
      jsx: monacoInstance.languages.typescript.JsxEmit.ReactJSX,
      moduleResolution: monacoInstance.languages.typescript.ModuleResolutionKind.NodeJs,
      target: monacoInstance.languages.typescript.ScriptTarget.ES2020,
    });

    const updateCursor = () => {
      const position = editorInstance.getPosition();
      if (position) {
        setLineColumn({ line: position.lineNumber, column: position.column });
      }
    };

    updateCursor();
    editorInstance.onDidChangeCursorPosition(updateCursor);
  };

  const handleEditorChange = (value: string | undefined) => {
    if (!activeFile) return;

    setWorkspace((current) => ({
      ...current,
      root: {
        ...current.root,
        children: updateWorkspaceFileContent(
          current.root.children,
          activeFile.path,
          value ?? ''
        ),
      },
    }));
  };

  const handleCloseTab = (filePath: string, event: React.SyntheticEvent) => {
    event.stopPropagation();

    setOpenTabs((currentTabs) => {
      const tabIndex = currentTabs.indexOf(filePath);
      const nextTabs = currentTabs.filter((path) => path !== filePath);

      if (workspace.activeFilePath === filePath) {
        const fallbackPath =
          nextTabs[Math.max(0, tabIndex - 1)] ??
          allFiles.find((file) => file.path !== filePath)?.path ??
          '';
        setWorkspace((current) => ({ ...current, activeFilePath: fallbackPath }));
      }

      return nextTabs;
    });
  };

  const handleCreateFile = () => {
    const requestedPath = window.prompt('File path', 'src/new-file.ts');
    if (!requestedPath) return;

    const nextPath = normalizeWorkspacePath(requestedPath);
    if (!nextPath) return;

    if (workspaceHasPath(workspace.root.children, nextPath)) {
      window.alert(`${nextPath} already exists.`);
      return;
    }

    setWorkspace((current) => {
      const nextState: WorkspaceState = {
        ...current,
        activeFilePath: nextPath,
        root: {
          ...current.root,
          children: addWorkspaceFile(current.root.children, nextPath),
        },
      };

      persistWorkspaceState(nextState);
      return nextState;
    });
    setOpenTabs((current) => (current.includes(nextPath) ? current : [...current, nextPath]));
    setActiveView('explorer');
  };

  const handleRenameNode = (node: WorkspaceNode) => {
    const nextName = window.prompt('Rename', node.name);
    if (!nextName || nextName === node.name) return;

    const nextPath = getNextPathForRename(node.path, nextName);
    if (workspaceHasPath(workspace.root.children, nextPath)) {
      window.alert(`${nextPath} already exists.`);
      return;
    }

    setWorkspace((current) => {
      const activeFilePath =
        current.activeFilePath === node.path
          ? nextPath
          : node.type === 'folder' && isPathWithin(current.activeFilePath, node.path)
            ? current.activeFilePath.replace(node.path, nextPath)
            : current.activeFilePath;

      const nextState: WorkspaceState = {
        ...current,
        activeFilePath,
        root: {
          ...current.root,
          children: renameWorkspaceNode(current.root.children, node.path, nextName),
        },
      };

      persistWorkspaceState(nextState);
      return nextState;
    });

    setOpenTabs((current) =>
      current.map((path) =>
        path === node.path
          ? nextPath
          : node.type === 'folder' && isPathWithin(path, node.path)
            ? path.replace(node.path, nextPath)
            : path
      )
    );
  };

  const handleDeleteNode = (node: WorkspaceNode) => {
    if (!window.confirm(`Delete ${node.name}?`)) return;

    setWorkspace((current) => {
      const nextChildren = deleteWorkspaceNode(current.root.children, node.path);
      const remainingFiles = flattenWorkspaceFiles(nextChildren);
      const activeWasDeleted =
        current.activeFilePath === node.path ||
        (node.type === 'folder' && isPathWithin(current.activeFilePath, node.path));
      const activeFilePath = activeWasDeleted
        ? remainingFiles[0]?.path ?? ''
        : current.activeFilePath;

      const nextState: WorkspaceState = {
        ...current,
        activeFilePath,
        root: {
          ...current.root,
          children: nextChildren,
        },
      };

      persistWorkspaceState(nextState);
      return nextState;
    });

    setOpenTabs((current) =>
      current.filter(
        (path) => path !== node.path && !(node.type === 'folder' && isPathWithin(path, node.path))
      )
    );
  };

  const handleToggleFolder = (folder: WorkspaceFolder) => {
    setWorkspace((current) => ({
      ...current,
      root: {
        ...current.root,
        expanded: folder.path === '' ? !folder.expanded : current.root.expanded,
        children:
          folder.path === ''
            ? current.root.children
            : setWorkspaceFolderExpanded(current.root.children, folder.path, !folder.expanded),
      },
    }));
  };

  const handleResetWorkspace = () => {
    if (!window.confirm('Reset workspace?')) return;

    const nextWorkspace = resetWorkspaceState();
    setWorkspace(nextWorkspace);
    setOpenTabs([nextWorkspace.activeFilePath]);
    setSearchQuery('');
    setActiveView('explorer');
    setRunOutput({
      kind: 'idle',
      title: 'Run',
      lines: ['Run a JavaScript, HTML, CSS, or Markdown file to see output here.'],
    });
  };

  const handleSaveToDesktop = () => {
    if (!activeFile) return;

    const desktopFile = saveFileToVirtualDesktop(activeFile);
    setDesktopSaveFlash(`${desktopFile.name} saved to Desktop`);

    if (desktopFlashTimeoutRef.current !== null) {
      window.clearTimeout(desktopFlashTimeoutRef.current);
    }
    desktopFlashTimeoutRef.current = window.setTimeout(() => setDesktopSaveFlash(''), 1800);
  };

  const handleFormatDocument = () => {
    if (!activeFile) return;
    if (!enabledExtensions.has('prettier')) {
      window.alert('Install Prettier Formatter from Extensions to format files.');
      setActiveView('extensions');
      return;
    }

    const formatted = formatContent(activeFile.content, activeFile.language);
    setWorkspace((current) => ({
      ...current,
      root: {
        ...current.root,
        children: updateWorkspaceFileContent(current.root.children, activeFile.path, formatted),
      },
    }));
  };

  const handleToggleExtension = (extensionId: ExtensionId) => {
    setEnabledExtensionIds((current) => {
      const next = current.includes(extensionId)
        ? current.filter((id) => id !== extensionId)
        : [...current, extensionId];

      persistEnabledExtensionIds(next);
      return next;
    });
  };

  const handleRunActiveFile = () => {
    if (!activeFile) return;

    setIsRunPanelOpen(true);

    if (
      ['html', 'css', 'markdown'].includes(activeFile.language) &&
      !enabledExtensions.has('live-preview')
    ) {
      setRunOutput({
        kind: 'console',
        title: 'Live Preview disabled',
        lines: ['Install or enable Live Preview from Extensions to preview this file type.'],
        isError: true,
      });
      return;
    }

    if (activeFile.language === 'html' || activeFile.language === 'css' || activeFile.language === 'markdown') {
      setRunOutput({
        kind: 'preview',
        title: activeFile.name,
        srcDoc: createPreviewDocument(activeFile),
      });
      return;
    }

    if (activeFile.language !== 'javascript' && activeFile.language !== 'typescript') {
      setRunOutput({
        kind: 'console',
        title: activeFile.name,
        lines: [`No runner is registered for ${LANGUAGE_LABELS[activeFile.language]}.`],
        isError: true,
      });
      return;
    }

    const outputLines: string[] = [];
    const runnerConsole = {
      log: (...args: unknown[]) => outputLines.push(args.map(String).join(' ')),
      warn: (...args: unknown[]) => outputLines.push(`Warning: ${args.map(String).join(' ')}`),
      error: (...args: unknown[]) => outputLines.push(`Error: ${args.map(String).join(' ')}`),
      table: (value: unknown) => outputLines.push(JSON.stringify(value, null, 2)),
    };

    try {
      const runnableCode = activeFile.content
        .replace(/^\s*import\s.+$/gm, '')
        .replace(/^\s*export\s+/gm, '');
      const run = new Function('console', runnableCode);
      run(runnerConsole);
      setRunOutput({
        kind: 'console',
        title: activeFile.name,
        lines: outputLines.length ? outputLines : ['Program completed without console output.'],
      });
    } catch (error) {
      setRunOutput({
        kind: 'console',
        title: activeFile.name,
        lines: [error instanceof Error ? error.message : String(error)],
        isError: true,
      });
    }
  };

  const handleCommitAll = () => {
    if (gitChanges.length === 0) return;

    const message = commitMessage.trim() || `Update ${gitChanges.length} file${gitChanges.length === 1 ? '' : 's'}`;
    const changedPaths = gitChanges.map((change) => change.file.path);
    const commit: WorkspaceCommit = {
      id: Date.now().toString(16),
      message,
      changedPaths,
      createdAt: Date.now(),
    };

    setWorkspace((current) => {
      const nextState: WorkspaceState = {
        ...current,
        root: {
          ...current.root,
          children: markWorkspaceCommitted(current.root.children),
        },
        commits: [commit, ...current.commits],
        lastSavedAt: Date.now(),
      };

      persistWorkspaceState(nextState);
      return nextState;
    });
    setCommitMessage('');
  };

  const handleDiscardAllChanges = () => {
    if (gitChanges.length === 0) return;
    if (!window.confirm('Discard all uncommitted changes?')) return;

    setWorkspace((current) => {
      const nextChildren = resetWorkspaceToGit(current.root.children);
      const nextFiles = flattenWorkspaceFiles(nextChildren);
      const activeFilePath = nextFiles.some((file) => file.path === current.activeFilePath)
        ? current.activeFilePath
        : nextFiles[0]?.path ?? '';
      const nextState: WorkspaceState = {
        ...current,
        activeFilePath,
        root: {
          ...current.root,
          children: nextChildren,
        },
      };

      persistWorkspaceState(nextState);
      return nextState;
    });
  };

  const renderSidebar = () => {
    if (activeView === 'search') {
      return (
        <div className="flex h-full flex-col">
          <div className="border-b border-zinc-800 p-3">
            <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              <span>Search</span>
              <span>{searchResults.length}</span>
            </div>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search"
              className="h-8 w-full rounded border border-zinc-700 bg-zinc-950 px-2 text-xs text-zinc-100 outline-none focus:border-sky-500"
            />
          </div>
          <div className="min-h-0 flex-1 overflow-auto py-2">
            {searchResults.map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => openFile(result.filePath)}
                className="w-full px-3 py-2 text-left hover:bg-zinc-800/70"
              >
                <div className="flex items-center gap-1.5 text-[12px] font-semibold text-zinc-200">
                  <FileCode2 className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="truncate">{result.fileName}</span>
                  <span className="ml-auto text-[10px] text-zinc-500">{result.lineNumber}</span>
                </div>
                <div className="mt-1 truncate pl-5 font-mono text-[11px] text-zinc-500">
                  {result.lineText}
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (activeView === 'source') {
      return (
        <div className="flex h-full flex-col">
          <div className="border-b border-zinc-800 p-3">
            <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              <span>Source Control</span>
              <span>{gitChanges.length}</span>
            </div>
            <div className="mb-2 flex items-center gap-2 rounded border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-[11px] text-zinc-300">
              <GitBranch className="h-3.5 w-3.5 text-emerald-300" />
              <span>{workspace.gitBranch}</span>
            </div>
            <input
              value={commitMessage}
              onChange={(event) => setCommitMessage(event.target.value)}
              placeholder="Commit message"
              className="mb-2 h-8 w-full rounded border border-zinc-700 bg-zinc-950 px-2 text-xs text-zinc-100 outline-none focus:border-emerald-500"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCommitAll}
                disabled={gitChanges.length === 0}
                className="rounded bg-emerald-600 px-2 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
              >
                Commit
              </button>
              <button
                type="button"
                onClick={handleDiscardAllChanges}
                disabled={gitChanges.length === 0}
                className="rounded border border-zinc-700 px-2 py-1.5 text-xs font-semibold text-zinc-200 disabled:cursor-not-allowed disabled:text-zinc-600"
              >
                Discard
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto py-2">
            {gitChanges.length === 0 ? (
              <div className="px-3 py-4 text-xs text-zinc-500">No source control changes.</div>
            ) : (
              gitChanges.map((change) => (
                <button
                  key={change.file.path}
                  type="button"
                  onClick={() => openFile(change.file.path)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-zinc-800/70"
                >
                  <span className={`w-4 shrink-0 font-bold ${change.status === 'U' ? 'text-amber-300' : 'text-emerald-300'}`}>
                    {change.status}
                  </span>
                  <span className="truncate text-zinc-200">{change.file.path}</span>
                </button>
              ))
            )}

            {enabledExtensions.has('gitlens') && (
              <div className="mt-3 border-t border-zinc-800 pt-3">
                <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  GitLens History
                </div>
                {workspace.commits.slice(0, 6).map((commit) => (
                  <div key={commit.id} className="px-3 py-2 text-xs">
                    <div className="truncate font-semibold text-zinc-200">{commit.message}</div>
                    <div className="mt-0.5 text-[10px] text-zinc-500">
                      {commit.id.slice(0, 7)} - {formatCommitTime(commit.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (activeView === 'extensions') {
      return (
        <div className="flex h-full flex-col">
          <div className="border-b border-zinc-800 p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Extensions
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-2">
            {EXTENSIONS.map((extension) => {
              const enabled = enabledExtensions.has(extension.id);

              return (
                <div key={extension.id} className="mb-2 rounded border border-zinc-800 bg-zinc-900/45 p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-zinc-800 text-sky-300">
                      <Package className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-bold text-zinc-100">{extension.name}</div>
                      <div className="text-[10px] text-zinc-500">{extension.publisher}</div>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-zinc-400">{extension.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                      {extension.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleExtension(extension.id)}
                      className={`rounded px-2.5 py-1 text-[11px] font-bold ${
                        enabled
                          ? 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600'
                          : 'bg-sky-600 text-white hover:bg-sky-500'
                      }`}
                      aria-label={`${enabled ? 'Disable' : 'Install'} ${extension.name}`}
                    >
                      {enabled ? 'Enabled' : 'Install'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (activeView === 'settings') {
      return (
        <div className="flex h-full flex-col p-3">
          <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Settings
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={saveWorkspace}
              className="flex items-center gap-2 rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-left text-xs font-semibold text-zinc-100 hover:border-sky-500"
            >
              <Save className="h-4 w-4 text-sky-400" />
              <span>Save all files</span>
            </button>
            <button
              type="button"
              onClick={handleSaveToDesktop}
              className="flex items-center gap-2 rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-left text-xs font-semibold text-zinc-100 hover:border-emerald-400"
            >
              <Download className="h-4 w-4 text-emerald-300" />
              <span>Save active file to Desktop</span>
            </button>
            <button
              type="button"
              onClick={handleResetWorkspace}
              className="flex items-center gap-2 rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-left text-xs font-semibold text-zinc-100 hover:border-red-400"
            >
              <RotateCcw className="h-4 w-4 text-red-300" />
              <span>Reset workspace</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Explorer
          </span>
          <button
            type="button"
            onClick={handleCreateFile}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            aria-label="Create file"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto py-2">
          <WorkspaceTreeNode
            node={workspace.root}
            depth={0}
            activeFilePath={activeFile?.path ?? ''}
            dirtyPaths={dirtyPaths}
            gitChangePaths={gitChangePaths}
            iconThemeEnabled={iconThemeEnabled}
            onDeleteNode={handleDeleteNode}
            onOpenFile={openFile}
            onRenameNode={handleRenameNode}
            onToggleFolder={handleToggleFolder}
          />
        </div>
      </div>
    );
  };

  return (
    <div
      className="vscode-app flex h-full w-full select-none bg-[#1e1e1e] text-zinc-300"
      data-testid="vscode-app"
    >
      <div className="vscode-activity-bar flex w-12 shrink-0 flex-col items-center justify-between border-r border-zinc-800 bg-[#181818] py-3 text-zinc-500">
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveView('explorer')}
            className={`rounded-md p-2 transition-colors ${
              activeView === 'explorer' ? 'bg-zinc-800 text-white' : 'hover:text-white'
            }`}
            aria-label="Explorer"
          >
            <Files className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setActiveView('search')}
            className={`rounded-md p-2 transition-colors ${
              activeView === 'search' ? 'bg-zinc-800 text-white' : 'hover:text-white'
            }`}
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setActiveView('source')}
            className={`relative rounded-md p-2 transition-colors ${
              activeView === 'source' ? 'bg-zinc-800 text-white' : 'hover:text-white'
            }`}
            aria-label="Source Control"
          >
            <GitBranch className="h-5 w-5" />
            {gitChanges.length > 0 && (
              <span className="absolute right-0 top-0 min-w-4 rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-white">
                {gitChanges.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveView('extensions')}
            className={`rounded-md p-2 transition-colors ${
              activeView === 'extensions' ? 'bg-zinc-800 text-white' : 'hover:text-white'
            }`}
            aria-label="Extensions"
          >
            <Package className="h-5 w-5" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setActiveView('settings')}
          className={`rounded-md p-2 transition-colors ${
            activeView === 'settings' ? 'bg-zinc-800 text-white' : 'hover:text-white'
          }`}
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>

      <aside className="vscode-sidebar flex w-64 shrink-0 flex-col border-r border-zinc-800 bg-[#202020]">
        {renderSidebar()}
      </aside>

      <main className="vscode-editor flex min-w-0 flex-1 flex-col bg-[#1e1e1e]">
        <div className="vscode-commandbar flex h-9 shrink-0 items-center gap-1 border-b border-zinc-800 bg-[#181818] px-2">
          <button
            type="button"
            onClick={saveWorkspace}
            className="flex h-7 items-center gap-1.5 rounded px-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
            aria-label="Save all files"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save</span>
          </button>
          <button
            type="button"
            onClick={handleSaveToDesktop}
            className="flex h-7 items-center gap-1.5 rounded px-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
            aria-label="Save active file to Desktop"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Desktop</span>
          </button>
          <button
            type="button"
            onClick={handleRunActiveFile}
            className="flex h-7 items-center gap-1.5 rounded px-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
            aria-label="Run active file"
          >
            <Play className="h-3.5 w-3.5 text-emerald-300" />
            <span>Run</span>
          </button>
          <button
            type="button"
            onClick={handleFormatDocument}
            className="flex h-7 items-center gap-1.5 rounded px-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
            aria-label="Format document"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Format</span>
          </button>
          <div className="ml-auto flex min-w-0 items-center gap-2 text-[11px] text-zinc-500">
            {desktopSaveFlash && <span className="truncate text-emerald-300">{desktopSaveFlash}</span>}
            <span className="hidden sm:inline">{enabledExtensionIds.length} extensions</span>
          </div>
        </div>

        <div className="vscode-tabs flex h-9 shrink-0 items-center overflow-x-auto border-b border-zinc-800 bg-[#181818]">
          {visibleTabs.map((file) => {
            const isActive = activeFile?.path === file.path;
            const isDirty = dirtyPaths.has(file.path);

            return (
              <button
                key={file.path}
                type="button"
                onClick={() => openFile(file.path)}
                className={`group flex h-9 shrink-0 items-center gap-2 border-r border-zinc-800 px-3 text-xs transition-colors ${
                  isActive
                    ? 'border-t-2 border-t-sky-500 bg-[#1e1e1e] text-zinc-100'
                    : 'bg-[#202020] text-zinc-500 hover:bg-[#252526] hover:text-zinc-200'
                }`}
                aria-label={`Open tab ${file.name}`}
              >
                <FileCode2 className={`h-3.5 w-3.5 ${getFileIconColor(file, iconThemeEnabled)}`} />
                <span>{file.name}</span>
                {gitChangePaths.has(file.path) && <span className="text-emerald-300">M</span>}
                {isDirty && <span className="text-amber-300">*</span>}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => handleCloseTab(file.path, event)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      handleCloseTab(file.path, event);
                    }
                  }}
                  className="rounded p-0.5 text-zinc-500 opacity-0 transition-opacity hover:bg-zinc-700 hover:text-zinc-100 group-hover:opacity-100"
                  aria-label={`Close ${file.name}`}
                >
                  <X className="h-3 w-3" />
                </span>
              </button>
            );
          })}
        </div>

        <div className="vscode-code min-h-0 flex-1 select-text overflow-hidden bg-[#1e1e1e]">
          {activeFile ? (
            <Editor
              height="100%"
              path={activeFile.path}
              language={getLanguageFromPath(activeFile.path)}
              value={activeFile.content}
              theme="vs-dark"
              onChange={handleEditorChange}
              onMount={handleEditorMount}
              loading={
                <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                  Loading editor
                </div>
              }
              options={{
                automaticLayout: true,
                cursorBlinking: 'smooth',
                fontFamily: 'Fira Code, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontLigatures: true,
                fontSize: 12,
                lineHeight: 20,
                minimap: { enabled: false },
                padding: { top: 12, bottom: 12 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                tabSize: 2,
                wordWrap: 'off',
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-zinc-500">
              No file selected
            </div>
          )}
        </div>

        {isRunPanelOpen && (
          <div className="h-[32%] min-h-28 shrink-0 border-t border-zinc-800 bg-[#111111]" data-testid="vscode-run-panel">
            <div className="flex h-8 items-center justify-between border-b border-zinc-800 px-3 text-xs text-zinc-300">
              <span className="flex items-center gap-2 font-semibold">
                <Terminal className="h-3.5 w-3.5 text-emerald-300" />
                {runOutput.title}
              </span>
              <button
                type="button"
                onClick={() => setIsRunPanelOpen(false)}
                className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-100"
                aria-label="Close run panel"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {runOutput.kind === 'preview' ? (
              <iframe
                title="VS Code run preview"
                data-testid="vscode-run-preview"
                sandbox="allow-scripts"
                srcDoc={runOutput.srcDoc}
                className="h-[calc(100%-2rem)] w-full bg-white"
              />
            ) : (
              <pre
                data-testid="vscode-run-console"
                className={`h-[calc(100%-2rem)] overflow-auto p-3 font-mono text-[11px] leading-relaxed ${
                  runOutput.kind === 'console' && runOutput.isError ? 'text-red-300' : 'text-zinc-300'
                }`}
              >
                {runOutput.lines.join('\n')}
              </pre>
            )}
          </div>
        )}

        <footer className="flex h-6 shrink-0 items-center justify-between bg-sky-700 px-3 text-[11px] font-medium text-white">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex shrink-0 items-center gap-1">
              <GitBranch className="h-3 w-3" />
              {workspace.gitBranch}
            </span>
            <span className="truncate">{activeFile?.path ?? 'No file'}</span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span data-testid="vscode-save-status">
              {saveFlash ? 'Saved' : hasDirtyFiles ? `${dirtyPaths.size} unsaved` : `Saved ${formatSavedTime(workspace.lastSavedAt)}`}
            </span>
            <span>{gitChanges.length ? `${gitChanges.length} changes` : 'Clean'}</span>
            <span>{LANGUAGE_LABELS[activeFile?.language ?? 'plaintext']}</span>
            <span>
              Ln {lineColumn.line}, Col {lineColumn.column}
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
};
