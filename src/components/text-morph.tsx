"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { MorphController } from "torph";

interface TextMorphProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  as?: keyof HTMLElementTagNameMap;
}

const SPRING_DEFAULTS = {
  stiffness: 170,
  damping: 22,
  mass: 0.8,
};

function flatten(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (!node || typeof node === "boolean") return "";
  if (Array.isArray(node)) return node.map(flatten).join("");
  return "";
}

export function TextMorph({
  children,
  className,
  style,
  as: Tag = "span",
}: TextMorphProps) {
  const ref = useRef<HTMLElement | null>(null);
  const controllerRef = useRef<MorphController | null>(null);
  const text = flatten(children);

  // Capture initial text so React never updates the DOM after mount.
  // Torph owns the element's content from the first useEffect onward.
  // eslint-disable-next-line react-hooks/refs -- intentional: stable initial value for dangerouslySetInnerHTML, read only once
  const initialText = useRef(text).current;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctrl = new MorphController();
    controllerRef.current = ctrl;
    ctrl.attach(el, { ease: SPRING_DEFAULTS });

    return () => {
      ctrl.destroy();
      controllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    controllerRef.current?.update(text);
  }, [text]);

  const El = Tag as "span";

  return (
    <El
      ref={ref as React.Ref<HTMLSpanElement>}
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: initialText }}
      suppressHydrationWarning
    />
  );
}
