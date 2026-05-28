export const VSCODE_WORKSPACE_STORAGE_KEY = 'macos_vscode_workspace_v1';

export type WorkspaceLanguage =
  | 'typescript'
  | 'javascript'
  | 'json'
  | 'css'
  | 'markdown'
  | 'html'
  | 'plaintext';

export interface WorkspaceFile {
  id: string;
  type: 'file';
  name: string;
  path: string;
  language: WorkspaceLanguage;
  content: string;
  savedContent: string;
}

export interface WorkspaceFolder {
  id: string;
  type: 'folder';
  name: string;
  path: string;
  expanded: boolean;
  children: WorkspaceNode[];
}

export type WorkspaceNode = WorkspaceFile | WorkspaceFolder;

export interface WorkspaceState {
  root: WorkspaceFolder;
  activeFilePath: string;
  lastSavedAt: number;
}

type StoredWorkspaceState = Omit<WorkspaceState, 'lastSavedAt'> & {
  lastSavedAt?: number;
};

const createFile = (
  path: string,
  language: WorkspaceLanguage,
  content: string
): WorkspaceFile => ({
  id: `file:${path}`,
  type: 'file',
  name: path.split('/').at(-1) ?? path,
  path,
  language,
  content,
  savedContent: content,
});

const createFolder = (
  path: string,
  name: string,
  children: WorkspaceNode[],
  expanded = true
): WorkspaceFolder => ({
  id: `folder:${path || name}`,
  type: 'folder',
  name,
  path,
  expanded,
  children,
});

export const DEFAULT_WORKSPACE_STATE: WorkspaceState = {
  activeFilePath: 'src/App.tsx',
  lastSavedAt: Date.now(),
  root: createFolder('', 'sharp-bose', [
    createFolder('src', 'src', [
      createFile(
        'src/App.tsx',
        'typescript',
        `import React from 'react';
import { useWindowStore } from './store/useWindowStore';
import { BootScreen } from './components/BootScreen';
import { LockScreen } from './components/LockScreen';
import { MenuBar } from './components/MenuBar';
import { Desktop } from './components/Desktop';
import { Dock } from './components/Dock';

export const App: React.FC = () => {
  const isBooted = useWindowStore((state) => state.isBooted);
  const isLocked = useWindowStore((state) => state.isLocked);
  const bootSystem = useWindowStore((state) => state.bootSystem);

  if (!isBooted) {
    return <BootScreen onBootComplete={bootSystem} />;
  }

  if (isLocked) {
    return <LockScreen />;
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <MenuBar />
      <Desktop />
      <Dock />
    </div>
  );
};
`
      ),
      createFolder('src/components', 'components', [
        createFile(
          'src/components/Dock.tsx',
          'typescript',
          `import React from 'react';
import { Code2, FileText, FolderOpen, Globe, Settings, Terminal } from 'lucide-react';
import { useWindowStore } from '../store/useWindowStore';

const dockItems = [
  { id: 'finder', name: 'Finder', icon: FolderOpen },
  { id: 'terminal', name: 'Terminal', icon: Terminal },
  { id: 'chrome', name: 'Chrome', icon: Globe },
  { id: 'vscode', name: 'VS Code', icon: Code2 },
  { id: 'notes', name: 'Notes', icon: FileText },
  { id: 'settings', name: 'System Settings', icon: Settings },
];

export const Dock: React.FC = () => {
  const openWindow = useWindowStore((state) => state.openWindow);

  return (
    <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 flex gap-3 rounded-3xl glass px-4 py-3">
      {dockItems.map((item) => {
        const Icon = item.icon;

        return (
          <button key={item.id} onClick={() => openWindow(item.id)} aria-label={item.name}>
            <Icon className="h-6 w-6" />
          </button>
        );
      })}
    </nav>
  );
};
`
        ),
      ]),
      createFolder('src/store', 'store', [
        createFile(
          'src/store/useWindowStore.ts',
          'typescript',
          `import { create } from 'zustand';

export interface AppWindow {
  id: string;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  position: { x: number; y: number };
}

interface SystemState {
  isBooted: boolean;
  isLocked: boolean;
  activeWindow: string | null;
  windows: Record<string, AppWindow>;
  bootSystem: () => void;
  unlockSystem: () => void;
  openWindow: (id: string) => void;
}

export const useWindowStore = create<SystemState>((set) => ({
  isBooted: false,
  isLocked: true,
  activeWindow: 'finder',
  windows: {},
  bootSystem: () => set({ isBooted: true }),
  unlockSystem: () => set({ isLocked: false }),
  openWindow: (id) => set({ activeWindow: id }),
}));
`
        ),
      ]),
      createFile(
        'src/index.css',
        'css',
        `@import "tailwindcss";

html,
body,
#root {
  height: 100%;
  margin: 0;
}

.glass {
  background: rgb(255 255 255 / 20%);
  backdrop-filter: blur(20px);
  border: 1px solid rgb(255 255 255 / 22%);
}
`
      ),
    ]),
    createFile(
      'package.json',
      'json',
      `{
  "name": "sharp-bose",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "test:ui": "playwright test"
  },
  "dependencies": {
    "react": "^19.2.6",
    "react-dom": "^19.2.6",
    "zustand": "^5.0.13"
  }
}
`
    ),
    createFile(
      'README.md',
      'markdown',
      `# macOS Portfolio

Interactive macOS-style portfolio built with React, TypeScript, Vite, Tailwind CSS, Zustand, GSAP, and Lucide icons.

## Development

\`\`\`powershell
npm.cmd install
npm.cmd run dev
\`\`\`

## Verification

\`\`\`powershell
npm.cmd run lint
npx.cmd tsc -b --pretty false
npm.cmd run build
\`\`\`
`
    ),
  ]),
};

export const cloneWorkspaceState = (state: WorkspaceState = DEFAULT_WORKSPACE_STATE): WorkspaceState =>
  JSON.parse(JSON.stringify(state)) as WorkspaceState;

export const flattenWorkspaceFiles = (nodes: WorkspaceNode[]): WorkspaceFile[] =>
  nodes.flatMap((node) => (node.type === 'file' ? [node] : flattenWorkspaceFiles(node.children)));

export const findWorkspaceFile = (
  nodes: WorkspaceNode[],
  filePath: string
): WorkspaceFile | null => {
  for (const node of nodes) {
    if (node.type === 'file' && node.path === filePath) {
      return node;
    }

    if (node.type === 'folder') {
      const match = findWorkspaceFile(node.children, filePath);
      if (match) return match;
    }
  }

  return null;
};

export const getLanguageFromPath = (filePath: string): WorkspaceLanguage => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) return 'typescript';
  if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) return 'javascript';
  if (filePath.endsWith('.json')) return 'json';
  if (filePath.endsWith('.css')) return 'css';
  if (filePath.endsWith('.md')) return 'markdown';
  if (filePath.endsWith('.html')) return 'html';
  return 'plaintext';
};

const getParentPath = (filePath: string) => filePath.split('/').slice(0, -1).join('/');

const getBaseName = (filePath: string) => filePath.split('/').at(-1)?.trim() ?? '';

export const normalizeWorkspacePath = (value: string): string =>
  value
    .replaceAll('\\', '/')
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean)
    .join('/');

export const workspaceHasPath = (nodes: WorkspaceNode[], path: string): boolean =>
  nodes.some((node) => {
    if (node.path === path) return true;
    if (node.type === 'folder') return workspaceHasPath(node.children, path);
    return false;
  });

export const updateWorkspaceFileContent = (
  nodes: WorkspaceNode[],
  filePath: string,
  content: string
): WorkspaceNode[] =>
  nodes.map((node) => {
    if (node.type === 'file' && node.path === filePath) {
      return { ...node, content };
    }

    if (node.type === 'folder') {
      return { ...node, children: updateWorkspaceFileContent(node.children, filePath, content) };
    }

    return node;
  });

export const markWorkspaceSaved = (nodes: WorkspaceNode[]): WorkspaceNode[] =>
  nodes.map((node) => {
    if (node.type === 'file') {
      return { ...node, savedContent: node.content };
    }

    return { ...node, children: markWorkspaceSaved(node.children) };
  });

export const setWorkspaceFolderExpanded = (
  nodes: WorkspaceNode[],
  folderPath: string,
  expanded: boolean
): WorkspaceNode[] =>
  nodes.map((node) => {
    if (node.type === 'folder' && node.path === folderPath) {
      return { ...node, expanded };
    }

    if (node.type === 'folder') {
      return { ...node, children: setWorkspaceFolderExpanded(node.children, folderPath, expanded) };
    }

    return node;
  });

export const addWorkspaceFile = (nodes: WorkspaceNode[], filePath: string): WorkspaceNode[] => {
  const normalizedPath = normalizeWorkspacePath(filePath);
  const parentPath = getParentPath(normalizedPath);
  const fileName = getBaseName(normalizedPath);

  if (!fileName) return nodes;

  if (!parentPath) {
    return [
      ...nodes,
      createFile(normalizedPath, getLanguageFromPath(normalizedPath), ''),
    ].sort(sortWorkspaceNodes);
  }

  return nodes.map((node) => {
    if (node.type !== 'folder') return node;

    if (node.path === parentPath) {
      return {
        ...node,
        expanded: true,
        children: [
          ...node.children,
          createFile(normalizedPath, getLanguageFromPath(normalizedPath), ''),
        ].sort(sortWorkspaceNodes),
      };
    }

    return { ...node, children: addWorkspaceFile(node.children, normalizedPath) };
  });
};

export const renameWorkspaceNode = (
  nodes: WorkspaceNode[],
  currentPath: string,
  nextName: string
): WorkspaceNode[] => {
  const cleanName = nextName.trim().replaceAll('/', '').replaceAll('\\', '');
  if (!cleanName) return nodes;

  return nodes.map((node) => {
    if (node.path === currentPath) {
      const parentPath = getParentPath(currentPath);
      const nextPath = parentPath ? `${parentPath}/${cleanName}` : cleanName;

      if (node.type === 'file') {
        return {
          ...node,
          id: `file:${nextPath}`,
          name: cleanName,
          path: nextPath,
          language: getLanguageFromPath(nextPath),
        };
      }

      return renameFolderWithChildren(node, nextPath, cleanName);
    }

    if (node.type === 'folder') {
      return { ...node, children: renameWorkspaceNode(node.children, currentPath, nextName) };
    }

    return node;
  });
};

export const deleteWorkspaceNode = (nodes: WorkspaceNode[], path: string): WorkspaceNode[] =>
  nodes
    .filter((node) => node.path !== path)
    .map((node) => {
      if (node.type !== 'folder') return node;
      return { ...node, children: deleteWorkspaceNode(node.children, path) };
    });

export const loadWorkspaceState = (): WorkspaceState => {
  if (typeof window === 'undefined') {
    return cloneWorkspaceState();
  }

  const stored = window.localStorage.getItem(VSCODE_WORKSPACE_STORAGE_KEY);
  if (!stored) {
    return cloneWorkspaceState();
  }

  try {
    const parsed = JSON.parse(stored) as StoredWorkspaceState;
    if (!parsed.root || parsed.root.type !== 'folder') {
      return cloneWorkspaceState();
    }

    return {
      root: parsed.root,
      activeFilePath: parsed.activeFilePath,
      lastSavedAt: parsed.lastSavedAt ?? Date.now(),
    };
  } catch {
    return cloneWorkspaceState();
  }
};

export const persistWorkspaceState = (state: WorkspaceState) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(VSCODE_WORKSPACE_STORAGE_KEY, JSON.stringify(state));
};

export const resetWorkspaceState = (): WorkspaceState => {
  const nextState = cloneWorkspaceState();
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(VSCODE_WORKSPACE_STORAGE_KEY, JSON.stringify(nextState));
  }

  return nextState;
};

const sortWorkspaceNodes = (a: WorkspaceNode, b: WorkspaceNode) => {
  if (a.type !== b.type) {
    return a.type === 'folder' ? -1 : 1;
  }

  return a.name.localeCompare(b.name);
};

const renameFolderWithChildren = (
  folder: WorkspaceFolder,
  nextPath: string,
  nextName: string
): WorkspaceFolder => {
  const previousPath = folder.path;
  const updateChildPath = (node: WorkspaceNode): WorkspaceNode => {
    const relativePath = node.path.slice(previousPath.length).replace(/^\//, '');
    const nextNodePath = relativePath ? `${nextPath}/${relativePath}` : nextPath;

    if (node.type === 'file') {
      return {
        ...node,
        id: `file:${nextNodePath}`,
        path: nextNodePath,
        language: getLanguageFromPath(nextNodePath),
      };
    }

    return {
      ...node,
      id: `folder:${nextNodePath}`,
      path: nextNodePath,
      children: node.children.map(updateChildPath),
    };
  };

  return {
    ...folder,
    id: `folder:${nextPath}`,
    name: nextName,
    path: nextPath,
    children: folder.children.map(updateChildPath),
  };
};
