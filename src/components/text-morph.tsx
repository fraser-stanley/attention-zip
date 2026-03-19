"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
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

/**
 * Mirrors torph/react's official TextMorph pattern:
 * - MorphController created eagerly in useRef (not inside an effect)
 * - attach() in useEffect keyed on serialized config
 * - update() via useCallback, called from a separate useEffect([text, update])
 * - dangerouslySetInnerHTML with stable initial text
 */
export function TextMorph({
  children,
  className,
  style,
  as: Tag = "span",
}: TextMorphProps) {
  const ref = useRef<HTMLElement | null>(null);
  const controllerRef = useRef(new MorphController());
  const text = flatten(children);
  const [initialHtml] = useState(() => ({ __html: text }));

  const configKey = MorphController.serializeConfig({ ease: SPRING_DEFAULTS });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const controller = controllerRef.current;
    controller.attach(el, { ease: SPRING_DEFAULTS });
    return () => {
      controller.destroy();
    };
  }, [configKey]);

  const update = useCallback((value: string) => {
    controllerRef.current.update(value);
  }, []);

  useEffect(() => {
    update(text);
  }, [text, update]);

  const Element = Tag as "span";

  return (
    <Element
      ref={ref as React.Ref<HTMLSpanElement>}
      className={className}
      style={style}
      dangerouslySetInnerHTML={initialHtml}
      suppressHydrationWarning
    />
  );
}
