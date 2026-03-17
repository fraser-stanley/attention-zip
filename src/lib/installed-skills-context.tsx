"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const STORAGE_KEY = "zora:installed-skills";
const DEFAULT_SEEDS = ["trend-scout", "portfolio-scout"];

interface InstalledSkillsContextValue {
  installedIds: string[];
  hydrated: boolean;
  install: (id: string) => void;
  uninstall: (id: string) => void;
  isInstalled: (id: string) => boolean;
}

const InstalledSkillsContext = createContext<InstalledSkillsContextValue>({
  installedIds: [],
  hydrated: false,
  install: () => {},
  uninstall: () => {},
  isInstalled: () => false,
});

// Tiny external store backed by localStorage
let listeners: Array<() => void> = [];
let snapshot: string[] | null = null;

function getSnapshot(): string[] {
  if (snapshot !== null) return snapshot;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      // First visit — seed with demo defaults
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SEEDS));
      snapshot = DEFAULT_SEEDS;
    } else {
      const parsed = JSON.parse(raw) as string[];
      snapshot = Array.isArray(parsed) ? parsed : [];
    }
  } catch {
    snapshot = [];
  }
  return snapshot;
}

function getServerSnapshot(): string[] {
  return [];
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function emit(next: string[]) {
  snapshot = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable or full
  }
  for (const listener of listeners) listener();
}

export function InstalledSkillsProvider({ children }: { children: ReactNode }) {
  const installedIds = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = typeof window !== "undefined";

  const install = useCallback((id: string) => {
    const current = getSnapshot();
    if (!current.includes(id)) {
      emit([...current, id]);
    }
  }, []);

  const uninstall = useCallback((id: string) => {
    emit(getSnapshot().filter((x) => x !== id));
  }, []);

  const isInstalled = useCallback(
    (id: string) => installedIds.includes(id),
    [installedIds]
  );

  return (
    <InstalledSkillsContext value={{ installedIds, hydrated, install, uninstall, isInstalled }}>
      {children}
    </InstalledSkillsContext>
  );
}

export function useInstalledSkills() {
  return useContext(InstalledSkillsContext);
}
