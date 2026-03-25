"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { seedDefaultSkills, clearInstalledSkills } from "@/lib/installed-skills-context";
import { isWalletSession, type WalletSession } from "@/lib/wallet-session";

const STORAGE_KEY = "zora:wallet";
type WalletSnapshot = WalletSession | null | undefined;

interface WalletContextValue {
  session: WalletSession | null;
  address: string | null;
  isConnected: boolean;
  hydrated: boolean;
  connect: (session: WalletSession) => void;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextValue>({
  session: null,
  address: null,
  isConnected: false,
  hydrated: false,
  connect: () => {},
  disconnect: () => {},
});

let listeners: Array<() => void> = [];
let snapshot: WalletSnapshot = undefined;

function parseStoredSession(raw: string | null): WalletSession | null {
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    return isWalletSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function getSnapshot(): WalletSession | null {
  if (snapshot !== undefined) return snapshot;
  try {
    snapshot = parseStoredSession(localStorage.getItem(STORAGE_KEY));
  } catch {
    snapshot = null;
  }
  return snapshot;
}

function getServerSnapshot(): WalletSnapshot {
  return undefined;
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function emit(next: WalletSession | null) {
  snapshot = next;
  try {
    if (next === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  } catch {
    // localStorage unavailable
  }
  for (const listener of listeners) listener();
}

export function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}\u2026${address.slice(-4)}`;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const storedAddress = useSyncExternalStore<WalletSnapshot>(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const hydrated = storedAddress !== undefined;
  const session = storedAddress ?? null;
  const address = session?.address ?? null;

  const connect = useCallback((nextSession: WalletSession) => {
    emit(nextSession);
    seedDefaultSkills();
  }, []);

  const disconnect = useCallback(() => {
    emit(null);
    clearInstalledSkills();
  }, []);

  return (
    <WalletContext
      value={{ session, address, isConnected: session !== null, hydrated, connect, disconnect }}
    >
      {children}
    </WalletContext>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
