import { Fragment } from "react";

import { cn } from "@/lib/utils";

type HighlightVariant = "shell" | "prompt" | "output";

type TokenKind =
  | "address"
  | "bullet"
  | "command"
  | "env"
  | "flag"
  | "label"
  | "number"
  | "operator"
  | "path"
  | "placeholder"
  | "string"
  | "subcommand"
  | "url";

const TOKEN_CLASS_NAMES: Record<TokenKind, string> = {
  address: "text-pink-700/70 dark:text-pink-300/70",
  bullet: "text-muted-foreground/80",
  command: "font-medium text-foreground/95",
  env: "text-orange-700/75 dark:text-orange-300/75",
  flag: "text-sky-700/75 dark:text-sky-300/75",
  label: "text-foreground/88",
  number: "font-medium tabular-nums text-rose-700/70 dark:text-rose-300/70",
  operator: "text-muted-foreground/85",
  path: "text-cyan-700/72 dark:text-cyan-300/72",
  placeholder: "text-amber-700/75 dark:text-amber-300/75",
  string: "text-emerald-700/72 dark:text-emerald-300/72",
  subcommand: "text-foreground/82",
  url: "text-blue-700/75 dark:text-blue-300/75",
};

function splitTokenEdges(token: string) {
  const leading = token.match(/^[([{]+/)?.[0] ?? "";
  const trailing = token.match(/[),.;]+$/)?.[0] ?? "";
  const core = token.slice(leading.length, token.length - trailing.length) || token;

  return { leading, core, trailing };
}

function classifyToken(
  fullToken: string,
  coreToken: string,
  variant: HighlightVariant,
  wordIndex: number,
): TokenKind | null {
  if (variant === "output" && /^[-*]$/.test(fullToken)) {
    return "bullet";
  }
  if (variant === "output" && /^[A-Za-z][\w-]*:$/.test(fullToken)) {
    return "label";
  }
  if (/^(?:\|\||&&|[|><=]+)$/.test(fullToken)) {
    return "operator";
  }
  if (/^--?[A-Za-z0-9][\w-]*$/.test(coreToken)) {
    return "flag";
  }
  if (/^\$[A-Z0-9_]+$/.test(coreToken)) {
    return "env";
  }
  if (/^(?:https?:\/\/|www\.)\S+$/.test(coreToken)) {
    return "url";
  }
  if (
    /^(?:~\/|\/|\.\/|\.\.\/)[^\s]+$/.test(coreToken) ||
    /^@?[\w.-]+\/[\w./-]+$/.test(coreToken)
  ) {
    return "path";
  }
  if (/^0x[a-fA-F0-9]{4,}$/.test(coreToken)) {
    return "address";
  }
  if (
    /^<[^>]+>$/.test(coreToken) ||
    /^\[[^\]]+\]$/.test(coreToken) ||
    /^\{[^}]+\}$/.test(coreToken)
  ) {
    return "placeholder";
  }
  if (/^(?:".*"|'.*'|`.*`)$/.test(coreToken)) {
    return "string";
  }
  if (
    /^\d+\.$/.test(fullToken) ||
    /^[+-]?\$?\d[\d,]*(?:\.\d+)?(?:[%KMBkmb]|ms|s|m|h|x)?$/.test(coreToken) ||
    /^\d{4}-\d{2}-\d{2}T\S+$/.test(coreToken)
  ) {
    return "number";
  }
  if (variant === "shell" && wordIndex === 0) {
    return "command";
  }
  if (
    variant === "shell" &&
    wordIndex === 1 &&
    /^[a-z][\w-]*$/i.test(coreToken)
  ) {
    return "subcommand";
  }

  return null;
}

function TokenSpan({
  token,
  variant,
  wordIndex,
}: {
  token: string;
  variant: HighlightVariant;
  wordIndex: number;
}) {
  const { leading, core, trailing } = splitTokenEdges(token);
  const tokenKind = classifyToken(token, core, variant, wordIndex);

  if (tokenKind === "label" || tokenKind === "bullet") {
    return <span className={TOKEN_CLASS_NAMES[tokenKind]}>{token}</span>;
  }

  return (
    <>
      {leading ? (
        <span className="text-muted-foreground/65">{leading}</span>
      ) : null}
      <span className={tokenKind ? TOKEN_CLASS_NAMES[tokenKind] : undefined}>
        {core}
      </span>
      {trailing ? (
        <span className="text-muted-foreground/65">{trailing}</span>
      ) : null}
    </>
  );
}

export function HighlightedCodeText({
  text,
  variant,
  className,
}: {
  text: string;
  variant: HighlightVariant;
  className?: string;
}) {
  const lines = text.split("\n");

  return (
    <span className={cn("text-inherit", className)}>
      {lines.map((line, lineIndex) => {
        const parts = line.split(/(\s+)/).filter((part) => part.length > 0);
        let wordIndex = 0;

        return (
          <Fragment key={`${variant}-${lineIndex}`}>
            {parts.map((part, partIndex) => {
              if (/^\s+$/.test(part)) {
                return (
                  <Fragment key={`${variant}-${lineIndex}-${partIndex}`}>
                    {part}
                  </Fragment>
                );
              }

              const currentWordIndex = wordIndex;
              wordIndex += 1;

              return (
                <TokenSpan
                  key={`${variant}-${lineIndex}-${partIndex}`}
                  token={part}
                  variant={variant}
                  wordIndex={currentWordIndex}
                />
              );
            })}
            {lineIndex < lines.length - 1 ? "\n" : null}
          </Fragment>
        );
      })}
    </span>
  );
}
