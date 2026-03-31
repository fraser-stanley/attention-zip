import { Fragment } from "react";

import { cn } from "@/lib/utils";

type HighlightVariant = "shell" | "prompt" | "output" | "plain";

type TokenKind =
  | "address"
  | "bullet"
  | "coin"
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

/** Light-mode token colors — vivid, matching terminal palette hues */
const TOKEN_CLASS_NAMES: Record<TokenKind, string> = {
  address: "text-[#cc00bf]",          // pink, light-mode pair of #FF00F0
  bullet: "text-muted-foreground/80",
  coin: "font-medium text-[#0070cc]", // blue, stands out as an entity
  command: "font-medium text-foreground",
  env: "text-[#c43a2f]",              // warm red, light pair of #ff6762
  flag: "text-[#0070cc]",             // blue, light pair of #69b1ff
  label: "text-foreground/88",
  number: "font-medium tabular-nums text-[#2d8a00]", // green, light pair of #3FFF00
  operator: "text-muted-foreground/85",
  path: "text-[#008a7a]",             // teal, light pair of #00cab1
  placeholder: "text-[#c43a2f]",      // warm red
  string: "text-[#1a8a3e]",           // green, light pair of #5ecc71
  subcommand: "text-foreground/82",
  url: "text-[#0070cc]",              // blue, light pair of #009fff
};

/** High-contrast TUI colors for dark terminal backgrounds.
 *  Anchored to our brand green (#3FFF00) and pink (#FF00F0),
 *  with complementary tones from the diffs.com palette. */
const TERMINAL_TOKEN_CLASS_NAMES: Record<TokenKind, string> = {
  address: "text-[#FF00F0]",          // brand pink
  bullet: "text-white/45",
  coin: "font-medium text-[#69b1ff]", // blue, entity highlight
  command: "font-medium text-white",
  env: "text-[#ff6762]",              // diffs deletion-dark / warm accent
  flag: "text-[#69b1ff]",             // diffs modified-dark
  label: "text-white/85",
  number: "font-medium tabular-nums text-[#3FFF00]", // brand green
  operator: "text-white/45",
  path: "text-[#00cab1]",             // diffs addition / teal
  placeholder: "text-[#ff6762]",      // warm accent
  string: "text-[#5ecc71]",           // diffs added-dark
  subcommand: "text-white/70",
  url: "text-[#009fff]",              // diffs modified
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
  if (variant === "plain") {
    return null;
  }
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
  if (/^`[^`]+`$/.test(coreToken)) {
    return "coin";
  }
  if (/^(?:".*"|'.*')$/.test(coreToken)) {
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
  terminal,
}: {
  token: string;
  variant: HighlightVariant;
  wordIndex: number;
  terminal?: boolean;
}) {
  const { leading, core, trailing } = splitTokenEdges(token);
  const tokenKind = classifyToken(token, core, variant, wordIndex);
  const palette = terminal ? TERMINAL_TOKEN_CLASS_NAMES : TOKEN_CLASS_NAMES;
  const punctuationClass = terminal ? "text-white/40" : "text-muted-foreground/65";

  if (tokenKind === "label" || tokenKind === "bullet") {
    return <span className={palette[tokenKind]}>{token}</span>;
  }

  // Strip backticks from coin names — render just the inner text
  if (tokenKind === "coin") {
    const inner = core.slice(1, -1);
    return (
      <>
        {leading ? <span className={punctuationClass}>{leading}</span> : null}
        <span className={palette.coin}>{inner}</span>
        {trailing ? <span className={punctuationClass}>{trailing}</span> : null}
      </>
    );
  }

  return (
    <>
      {leading ? (
        <span className={punctuationClass}>{leading}</span>
      ) : null}
      <span className={tokenKind ? palette[tokenKind] : undefined}>
        {core}
      </span>
      {trailing ? (
        <span className={punctuationClass}>{trailing}</span>
      ) : null}
    </>
  );
}

export function HighlightedCodeText({
  text,
  variant,
  className,
  terminal,
}: {
  text: string;
  variant: HighlightVariant;
  className?: string;
  terminal?: boolean;
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
                  terminal={terminal}
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
