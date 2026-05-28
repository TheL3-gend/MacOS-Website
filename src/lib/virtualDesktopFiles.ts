import { getLanguageFromPath, type WorkspaceLanguage } from './vscodeWorkspace';

export const VIRTUAL_DESKTOP_FILES_KEY = 'macos_virtual_desktop_files_v1';
export const VIRTUAL_DESKTOP_OPEN_REQUEST_KEY = 'macos_virtual_desktop_open_request_v1';
export const VIRTUAL_DESKTOP_FILES_EVENT = 'macos-virtual-desktop-files-updated';
export const VIRTUAL_DESKTOP_OPEN_EVENT = 'macos-open-desktop-file';

export interface VirtualDesktopFile {
  id: string;
  name: string;
  sourcePath: string;
  language: WorkspaceLanguage;
  content: string;
  updatedAt: number;
}

export interface VirtualDesktopOpenRequest {
  fileId: string;
  requestedAt: number;
}

const readJson = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;

  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeDesktopFiles = (files: VirtualDesktopFile[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(VIRTUAL_DESKTOP_FILES_KEY, JSON.stringify(files));
  window.dispatchEvent(new CustomEvent(VIRTUAL_DESKTOP_FILES_EVENT));
};

export const loadVirtualDesktopFiles = (): VirtualDesktopFile[] =>
  readJson<VirtualDesktopFile[]>(VIRTUAL_DESKTOP_FILES_KEY, []);

export const saveFileToVirtualDesktop = (file: {
  name: string;
  path: string;
  content: string;
  language?: WorkspaceLanguage;
}): VirtualDesktopFile => {
  const files = loadVirtualDesktopFiles();
  const name = file.name || file.path.split('/').at(-1) || 'untitled.txt';
  const now = Date.now();
  const existing = files.find((desktopFile) => desktopFile.name === name);
  const desktopFile: VirtualDesktopFile = {
    id: existing?.id ?? `desktop:${name}:${now}`,
    name,
    sourcePath: file.path,
    language: file.language ?? getLanguageFromPath(name),
    content: file.content,
    updatedAt: now,
  };
  const nextFiles = existing
    ? files.map((candidate) => (candidate.id === existing.id ? desktopFile : candidate))
    : [...files, desktopFile];

  writeDesktopFiles(nextFiles);
  return desktopFile;
};

export const requestOpenDesktopFile = (fileId: string) => {
  if (typeof window === 'undefined') return;

  const request: VirtualDesktopOpenRequest = {
    fileId,
    requestedAt: Date.now(),
  };

  window.localStorage.setItem(VIRTUAL_DESKTOP_OPEN_REQUEST_KEY, JSON.stringify(request));
  window.dispatchEvent(new CustomEvent(VIRTUAL_DESKTOP_OPEN_EVENT, { detail: request }));
};

export const consumeOpenDesktopFileRequest = (): VirtualDesktopOpenRequest | null => {
  if (typeof window === 'undefined') return null;

  const request = readJson<VirtualDesktopOpenRequest | null>(VIRTUAL_DESKTOP_OPEN_REQUEST_KEY, null);
  window.localStorage.removeItem(VIRTUAL_DESKTOP_OPEN_REQUEST_KEY);
  return request;
};
