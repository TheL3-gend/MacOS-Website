import React, { useCallback, useMemo, useRef, useState } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import {
  ChevronDown,
  ChevronRight,
  FileCode2,
  Files,
  Folder,
  FolderOpen,
  Plus,
  RotateCcw,
  Save,
  Search,
  Settings,
  Trash2,
  X,
  SquarePen,
} from 'lucide-react';
import {
  addWorkspaceFile,
  deleteWorkspaceNode,
  findWorkspaceFile,
  flattenWorkspaceFiles,
  getLanguageFromPath,
  loadWorkspaceState,
  markWorkspaceSaved,
  normalizeWorkspacePath,
  persistWorkspaceState,
  renameWorkspaceNode,
  resetWorkspaceState,
  setWorkspaceFolderExpanded,
  updateWorkspaceFileContent,
  workspaceHasPath,
  type WorkspaceFile,
  type WorkspaceFolder,
  type WorkspaceNode,
  type WorkspaceState,
} from '../../lib/vscodeWorkspace';

type ActivityView = 'explorer' | 'search' | 'settings';

interface SearchResult {
  id: string;
  filePath: string;
  fileName: string;
  lineNumber: number;
  lineText: string;
}

interface WorkspaceTreeNodeProps {
  node: WorkspaceNode;
  depth: number;
  activeFilePath: string;
  dirtyPaths: Set<string>;
  onDeleteNode: (node: WorkspaceNode) => void;
  onOpenFile: (filePath: string) => void;
  onRenameNode: (node: WorkspaceNode) => void;
  onToggleFolder: (folder: WorkspaceFolder) => void;
}

const LANGUAGE_LABELS: Record<string, string> = {
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  json: 'JSON',
  css: 'CSS',
  markdown: 'Markdown',
  html: 'HTML',
  plaintext: 'Plain Text',
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

const WorkspaceTreeNode: React.FC<WorkspaceTreeNodeProps> = ({
  node,
  depth,
  activeFilePath,
  dirtyPaths,
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
        <FileCode2 className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
        <span className="truncate">{node.name}</span>
        {isDirty && <span className="ml-auto pr-1 text-amber-300">*</span>}
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
  const [openTabs, setOpenTabs] = useState<string[]>(() => {
    const initialWorkspace = loadWorkspaceState();
    return [initialWorkspace.activeFilePath];
  });
  const [activeView, setActiveView] = useState<ActivityView>('explorer');
  const [searchQuery, setSearchQuery] = useState('');
  const [lineColumn, setLineColumn] = useState({ line: 1, column: 1 });
  const [saveFlash, setSaveFlash] = useState(false);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const saveFlashTimeoutRef = useRef<number | null>(null);

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
  const hasDirtyFiles = dirtyPaths.size > 0;
  const visibleTabs = useMemo(
    () =>
      openTabs
        .map((path) => findWorkspaceFile(workspace.root.children, path))
        .filter((file): file is WorkspaceFile => Boolean(file)),
    [openTabs, workspace.root.children]
  );

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

    setOpenTabs((current) => {
      const nextTabs = current.filter(
        (path) => path !== node.path && !(node.type === 'folder' && isPathWithin(path, node.path))
      );

      return nextTabs;
    });
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

      <aside className="vscode-sidebar flex w-60 shrink-0 flex-col border-r border-zinc-800 bg-[#202020]">
        {renderSidebar()}
      </aside>

      <main className="vscode-editor flex min-w-0 flex-1 flex-col bg-[#1e1e1e]">
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
                <FileCode2 className="h-3.5 w-3.5 text-indigo-400" />
                <span>{file.name}</span>
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
                fontFamily: 'Fira Code, ui-monospace, SFMono-Regular, Menlo, monospace',
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

        <footer className="flex h-6 shrink-0 items-center justify-between bg-sky-700 px-3 text-[11px] font-medium text-white">
          <div className="flex min-w-0 items-center gap-3">
            <span className="shrink-0">main</span>
            <span className="truncate">{activeFile?.path ?? 'No file'}</span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span data-testid="vscode-save-status">
              {saveFlash ? 'Saved' : hasDirtyFiles ? `${dirtyPaths.size} unsaved` : `Saved ${formatSavedTime(workspace.lastSavedAt)}`}
            </span>
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
