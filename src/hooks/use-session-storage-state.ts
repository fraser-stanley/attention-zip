"use client";

import { useCallback, useSyncExternalStore, type SetStateAction } from "react";

type Listener = () => void;

const listenersByKey = new Map<string, Set<Listener>>();
const snapshotsByKey = new Map<string, string | null>();

function readSnapshot(key: string) {
  if (snapshotsByKey.has(key)) {
    return snapshotsByKey.get(key) ?? null;
  }

  try {
    const value = window.sessionStorage.getItem(key);
    snapshotsByKey.set(key, value);
    return value;
  } catch {
    snapshotsByKey.set(key, null);
    return null;
  }
}

function subscribe(key: string, listener: Listener) {
  const listeners = listenersByKey.get(key) ?? new Set<Listener>();
  listeners.add(listener);
  listenersByKey.set(key, listeners);

  return () => {
    const currentListeners = listenersByKey.get(key);
    if (!currentListeners) {
      return;
    }

    currentListeners.delete(listener);

    if (currentListeners.size === 0) {
      listenersByKey.delete(key);
    }
  };
}

function emit(key: string) {
  const listeners = listenersByKey.get(key);
  if (!listeners) {
    return;
  }

  for (const listener of listeners) {
    listener();
  }
}

export function useSessionStorageState<T>({
  key,
  initialValue,
  parse,
  serialize,
}: {
  key: string;
  initialValue: T;
  parse: (rawValue: string) => T;
  serialize: (value: T) => string;
}) {
  const getValueSnapshot = useCallback(() => {
    const rawValue = readSnapshot(key);

    if (rawValue === null) {
      return initialValue;
    }

    try {
      return parse(rawValue);
    } catch {
      return initialValue;
    }
  }, [initialValue, key, parse]);

  const value = useSyncExternalStore(
    (listener) => subscribe(key, listener),
    getValueSnapshot,
    () => initialValue
  );

  const setValue = useCallback(
    (nextValue: SetStateAction<T>) => {
      const currentValue = getValueSnapshot();
      const resolvedValue =
        typeof nextValue === "function"
          ? (nextValue as (value: T) => T)(currentValue)
          : nextValue;
      const serializedValue = serialize(resolvedValue);

      snapshotsByKey.set(key, serializedValue);

      try {
        window.sessionStorage.setItem(key, serializedValue);
      } catch {
        // sessionStorage may be unavailable or full
      }

      emit(key);
    },
    [getValueSnapshot, key, serialize]
  );

  return [value, setValue] as const;
}
