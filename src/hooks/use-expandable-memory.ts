"use client";

import { useCallback } from "react";

import { useSessionStorageState } from "@/hooks/use-session-storage-state";

interface UseExpandableMemoryResult {
  expanded: boolean;
  setExpanded: (value: boolean) => void;
  toggleExpanded: () => void;
}

export function useExpandableMemory(
  storageKey: string,
  defaultExpanded = false
): UseExpandableMemoryResult {
  const [expanded, setExpanded] = useSessionStorageState<boolean>({
    key: storageKey,
    initialValue: defaultExpanded,
    parse: (storedValue) => storedValue === "true",
    serialize: (value) => (value ? "true" : "false"),
  });

  const toggleExpanded = useCallback(() => {
    setExpanded((current) => !current);
  }, [setExpanded]);

  return { expanded, setExpanded, toggleExpanded };
}
