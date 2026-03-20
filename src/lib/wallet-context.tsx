"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { seedDefaultSkills, clearInstalledSkills } from "@/lib/installed-skills-context";

const STORAGE_KEY = "zora:wallet";

interface WalletContextValue {
  address: string | null;
  isConnected: boolean;
  hydrated: boolean;
  connect: (address: string) => void;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextValue>({
  address: null,
  isConnected: false,
  hydrated: false,
  connect: () => {},
  disconnect: () => {},
});

let listeners: Array<() => void> = [];
let snapshot: string | null | undefined = undefined;

function getSnapshot(): string | null {
  if (snapshot !== undefined) return snapshot;
  try {
    snapshot = localStorage.getItem(STORAGE_KEY);
  } catch {
    snapshot = null;
  }
  return snapshot;
}

function getServerSnapshot(): string | null {
  return null;
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function emit(next: string | null) {
  snapshot = next;
  try {
    if (next === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, next);
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
  const address = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = typeof window !== "undefined";

  const connect = useCallback((addr: string) => {
    emit(addr);
    seedDefaultSkills();
  }, []);

  const disconnect = useCallback(() => {
    emit(null);
    clearInstalledSkills();
  }, []);

  return (
    <WalletContext value={{ address, isConnected: address !== null, hydrated, connect, disconnect }}>
      {children}
    </WalletContext>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
