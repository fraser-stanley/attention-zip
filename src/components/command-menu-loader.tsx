"use client";

import dynamic from "next/dynamic";

const CommandMenu = dynamic(
  () => import("@/components/command-menu").then((mod) => mod.CommandMenu),
  { ssr: false }
);

export function CommandMenuLoader() {
  return <CommandMenu />;
}
