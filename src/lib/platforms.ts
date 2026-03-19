export interface Platform {
  id: string;
  name: string;
  url: string;
  category: "claw" | "agent" | "framework";
}

export const platforms: Platform[] = [
  {
    id: "openclaw",
    name: "OpenClaw",
    url: "https://openclaw.ai",
    category: "claw",
  },
  {
    id: "nanoclaw",
    name: "NanoClaw",
    url: "https://nanoclaw.dev",
    category: "claw",
  },
  {
    id: "ironclaw",
    name: "IronClaw",
    url: "https://github.com/nearai/ironclaw",
    category: "claw",
  },
{
    id: "kimiclaw",
    name: "KimiClaw",
    url: "https://kimi-claw.com",
    category: "claw",
  },
  {
    id: "claude-code",
    name: "Claude Code",
    url: "https://docs.anthropic.com/en/docs/claude-code",
    category: "agent",
  },
  {
    id: "cursor",
    name: "Cursor",
    url: "https://cursor.com",
    category: "agent",
  },
  {
    id: "codex",
    name: "Codex",
    url: "https://openai.com/codex",
    category: "agent",
  },
  {
    id: "goose",
    name: "Goose",
    url: "https://block.github.io/goose/",
    category: "agent",
  },
  {
    id: "ollama",
    name: "Ollama",
    url: "https://ollama.com",
    category: "framework",
  },
  {
    id: "hermes",
    name: "Hermes",
    url: "https://nousresearch.com",
    category: "framework",
  },
  {
    id: "bankrbot",
    name: "BankrBot",
    url: "https://bankr.bot",
    category: "framework",
  },
];
