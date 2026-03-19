# Skill Optimization Agent Instructions

You are an autonomous agent optimizing Zora agent skills. Your goal is to improve the pass rate of a skill's SKILL.md against its test cases.

## Before You Start

Read these files to understand the current state:
- `scripts/autoresearch/results/latest_run.json` — which test cases are failing and why
- `scripts/autoresearch/results/scores.json` — pass rate history
- `<skill>/SKILL.md` — the current skill definition you'll be modifying
- `scripts/autoresearch/assertions/<skill>.py` — the assertions you're optimizing against
- `scripts/autoresearch/test_cases/<skill>.jsonl` — the test inputs

## The Loop

```
REPEAT (forever or N iterations):
  1. READ — latest_run.json, git log, SKILL.md
  2. ANALYZE — write failure analysis to results/failure_analysis.txt
  3. HYPOTHESIZE — pick ONE change that addresses the top failure pattern
  4. COMMIT — git commit the current state before modifying
  5. MODIFY — make the single change to SKILL.md
  6. VERIFY — run: python scripts/autoresearch/runner.py <skill>
  7. DECIDE:
     - If pass_rate improved → keep, commit with "experiment: <description>"
     - If pass_rate same or worse → git revert HEAD
  8. LOG — update results/scores.json with the outcome
  9. CONTINUE — back to step 1
```

## Phase 1: Setup (One Time)

Before entering the loop, establish baseline:

```bash
# 1. Verify runner works
python scripts/autoresearch/runner.py <skill>

# 2. Record baseline in scores.json
# 3. Read failure analysis in latest_run.json
# 4. Confirm understanding of the skill's purpose and constraints
```

## Phase 2: Failure Analysis

Before each change, write to `results/failure_analysis.txt`:

```
## Iteration N — <skill>

Current pass rate: X%

### Top Failing Assertions
1. assert_X — fails on Y% of cases
   Common pattern: <what the failing outputs have in common>

2. assert_Y — fails on Z% of cases
   Common pattern: <pattern>

### Hypothesis
<One specific change that addresses the #1 failure pattern>

### Change Plan
- Section to modify: <section name>
- Current text: "<relevant excerpt>"
- Proposed text: "<new text>"
```

## Phase 3: Making Changes

### Rules

1. **ONE change per iteration** — if it breaks, you know why
2. **Be specific** — "add empathy phrase" not "improve tone"
3. **Preserve constraints** — don't break other assertions to fix one
4. **Simplicity wins** — equal results + less text = better

### What You Can Change

- Section ordering in SKILL.md
- Wording of instructions
- Example output format
- Command sequences
- Troubleshooting guidance
- "When to Use" triggers

### What You Cannot Change

- The assertions themselves (those define quality)
- The test cases (those define coverage)
- CLI command syntax (that's fixed by the Zora CLI)
- Skill name and core purpose

## Phase 4: Verification

Run the evaluation:

```bash
python scripts/autoresearch/runner.py <skill>
```

The runner will:
1. Load SKILL.md as system prompt
2. Run each test case input
3. Apply all assertions to each output
4. Write detailed results to `results/latest_run.json`
5. Print pass rate

## Phase 5: Decision

```
IF pass_rate > previous_best:
  git commit -m "experiment: <one-line description of change>"
  Update scores.json with new high score
  Continue to next iteration

ELSE IF pass_rate == previous_best AND skill is simpler:
  git commit -m "experiment: simplify <section>"
  Continue to next iteration

ELSE:
  git revert HEAD
  Log failure reason
  Try a different hypothesis next iteration
```

## Phase 6: When Stuck

If pass rate plateaus for 3+ iterations:

1. **Re-read failures** — look for patterns you missed
2. **Try structural changes** — reorder sections, change example format
3. **Combine near-misses** — two 68% variants might combine to 75%
4. **Challenge assumptions** — is an assertion too strict? (flag for human review, don't change it yourself)

## Guard Command (Optional)

If configured, run a guard command after each change:

```bash
Guard: pnpm build
```

The guard must pass for changes to be kept. If the guard fails:
1. Revert the change
2. Log the guard failure
3. Try a different approach

## Stopping Conditions

Stop the loop when:
- Pass rate exceeds target (default: 85%)
- N iterations completed (if bounded run)
- Human interrupts with Ctrl+C
- Guard command fails repeatedly (3+ times on different changes)

## Git Conventions

```bash
# Before modifying SKILL.md
git add -A && git commit -m "checkpoint: before iteration N"

# After successful improvement
git commit -m "experiment: <description of what changed>"

# After regression
git revert HEAD --no-edit
git commit -m "revert: iteration N — <why it failed>"
```

## Example Session

```
Iteration 1:
  Read: latest_run.json shows assert_has_market_assessment fails 40%
  Analyze: Failing outputs end abruptly without assessment sentence
  Hypothesis: Add explicit instruction to end with assessment
  Change: Added "End every briefing with a plain-language assessment" to How It Works
  Verify: Pass rate 55% → 68%
  Decision: KEEP

Iteration 2:
  Read: latest_run.json shows assert_concise fails 25%
  Analyze: Some outputs exceed 200 words due to verbose section headers
  Hypothesis: Simplify example output to model brevity
  Change: Shortened example output, removed redundant phrases
  Verify: Pass rate 68% → 72%
  Decision: KEEP

Iteration 3:
  Read: latest_run.json shows assert_no_raw_json fails 15%
  Analyze: Quiet market cases return partial JSON
  Hypothesis: Add troubleshooting note about synthesizing prose
  Change: Added "Do not return raw JSON to the user. Synthesize into prose."
  Verify: Pass rate 72% → 71%
  Decision: REVERT

Iteration 4:
  Read: Same failure pattern as iteration 3
  Analyze: Issue is in How It Works, not Troubleshooting
  Hypothesis: Move JSON prose rule to step 2 of How It Works
  Change: Added rule to synthesis step
  Verify: Pass rate 72% → 78%
  Decision: KEEP
```

## Multi-Skill Runs

To optimize all skills:

```bash
for skill in trend-scout creator-pulse briefing-bot portfolio-scout momentum-trader; do
  python scripts/autoresearch/runner.py $skill
done
```

Or run with `--all`:

```bash
python scripts/autoresearch/runner.py --all
```

Cross-skill assertions (in `assertions/shared.py`) apply to all skills. Skill-specific assertions only apply to their skill.
