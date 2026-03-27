"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { seedDefaultSkills, clearInstalledSkills } from "@/lib/installed-skills-context";
import { normalizeWalletAddress } from "@/lib/wallet-address";

const STORAGE_KEY = "zora:wallet";
type WalletSnapshot = string | null | undefined;

interface WalletContextValue {
  address: string | null;
  isConnected: boolean;
  hydrated: boolean;
  setAddress: (address: string) => void;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextValue>({
  address: null,
  isConnected: false,
  hydrated: false,
  setAddress: () => {},
  disconnect: () => {},
});

let listeners: Array<() => void> = [];
let snapshot: WalletSnapshot = undefined;

function parseStoredAddress(raw: string | null): string | null {
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);

    if (typeof parsed === "string") {
      return normalizeWalletAddress(parsed);
    }

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "address" in parsed &&
      typeof parsed.address === "string"
    ) {
      return normalizeWalletAddress(parsed.address);
    }

    return null;
  } catch {
    return normalizeWalletAddress(raw);
  }
}

function getSnapshot(): string | null {
  if (snapshot !== undefined) return snapshot;
  try {
    snapshot = parseStoredAddress(localStorage.getItem(STORAGE_KEY));
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

function emit(next: string | null) {
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
  const address = storedAddress ?? null;

  const setAddress = useCallback((nextAddress: string) => {
    const normalizedAddress = normalizeWalletAddress(nextAddress);
    if (!normalizedAddress) return;

    emit(normalizedAddress);
    seedDefaultSkills();
  }, []);

  const disconnect = useCallback(() => {
    emit(null);
    clearInstalledSkills();
  }, []);

  return (
    <WalletContext value={{ address, isConnected: address !== null, hydrated, setAddress, disconnect }}>
      {children}
    </WalletContext>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
