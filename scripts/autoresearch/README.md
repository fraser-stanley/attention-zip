# Autoresearch: Skill Quality Loop

Autocompounding, autovalidating loop for Claude skills. Based on [Karpathy's autoresearch](https://github.com/karpathy/autoresearch) and [uditgoenka/autoresearch](https://github.com/uditgoenka/autoresearch).

## Core Idea

```
LOOP:
  1. Run skill against test cases
  2. Evaluate outputs with binary assertions
  3. Analyze failures (which assertions, which inputs)
  4. Generate improved SKILL.md variant
  5. Test variant → keep if pass rate improves, else revert
  6. Repeat
```

## Structure

```
scripts/autoresearch/
├── README.md                    # This file
├── AGENT_INSTRUCTIONS.md        # Protocol for the optimization agent
├── assertions/
│   ├── shared.py               # Cross-skill assertions (tone, safety, format)
│   ├── briefing_bot.py         # Briefing Bot assertions
│   ├── trend_scout.py          # Trend Scout assertions
│   ├── creator_pulse.py        # Creator Pulse assertions
│   ├── portfolio_scout.py      # Portfolio Scout assertions
│   └── momentum_trader.py      # Momentum Trader assertions
├── test_cases/
│   ├── briefing_bot.jsonl      # Test inputs for Briefing Bot
│   ├── trend_scout.jsonl       # Test inputs for Trend Scout
│   ├── creator_pulse.jsonl     # Test inputs for Creator Pulse
│   ├── portfolio_scout.jsonl   # Test inputs for Portfolio Scout
│   └── momentum_trader.jsonl   # Test inputs for Momentum Trader
├── runner.py                   # Evaluation harness
├── results/
│   ├── scores.json             # Pass rate history per skill
│   └── latest_run.json         # Detailed failure analysis
└── history/                    # Archived SKILL.md versions with scores
```

## Quick Start

```bash
# Run evaluation on a single skill
python scripts/autoresearch/runner.py briefing-bot

# Run all skills
python scripts/autoresearch/runner.py --all

# Start optimization loop (with droid or claude)
droid "Follow scripts/autoresearch/AGENT_INSTRUCTIONS.md and optimize briefing-bot"
```

## Binary Assertions

Each assertion returns True/False. Pass rate = percentage of test cases where ALL assertions pass.

### Why Binary > Subjective Scoring

- Deterministic: same output → same result every time
- Comparable: 65% vs 73% is meaningful
- Debuggable: know exactly which assertion failed on which input

### Shared Assertions (all skills)

| Assertion | Description |
|-----------|-------------|
| `assert_no_raw_json` | Output is prose, not raw JSON |
| `assert_no_hallucinated_commands` | Only uses documented CLI commands |
| `assert_concise` | Under word limit for skill type |
| `assert_no_sensitive_data` | No private keys, secrets, or PII |
| `assert_actionable` | Includes concrete next step or insight |

### Skill-Specific Assertions

See `assertions/<skill>.py` for the full list per skill.

## Test Cases

Each `.jsonl` file contains scenarios the skill should handle:

```jsonl
{"id": "morning_brief", "input": "Give me my morning briefing", "context": {}}
{"id": "volatile_market", "input": "What's happening on Zora?", "context": {"market_state": "volatile"}}
{"id": "quiet_market", "input": "Market summary", "context": {"market_state": "quiet"}}
```

Diversity > quantity. Cover:
- Happy path
- Edge cases (empty data, rate limits)
- Ambiguous requests
- Different phrasings of the same intent

## Results Format

`results/latest_run.json`:

```json
{
  "skill": "briefing-bot",
  "pass_rate": 0.72,
  "total_cases": 25,
  "passed": 18,
  "failed": 7,
  "failures": [
    {
      "id": "volatile_market",
      "failed_assertions": ["assert_has_market_assessment"],
      "output_preview": "Trending: looksmaxxing at $2.3M..."
    }
  ]
}
```

`results/scores.json`:

```json
{
  "briefing-bot": [
    {"timestamp": "2026-03-19T10:00:00Z", "pass_rate": 0.55, "version": "v1"},
    {"timestamp": "2026-03-19T10:15:00Z", "pass_rate": 0.72, "version": "v2"}
  ]
}
```

## Optimization Loop

See `AGENT_INSTRUCTIONS.md` for the full protocol. Key rules:

1. **One change per iteration** — atomic, testable changes
2. **Git as memory** — commit before verify, revert on regression
3. **Failure analysis first** — understand which assertions fail and why before changing
4. **Guard command** — optional safety net (e.g., `pnpm build` must still pass)
