#!/usr/bin/env python3
"""
Skill evaluation runner for Zora agent skills.

Usage:
    python runner.py briefing-bot           # Evaluate single skill
    python runner.py --all                  # Evaluate all skills
    python runner.py briefing-bot --dry-run # Show what would run without API calls

Requires:
    - ANTHROPIC_API_KEY environment variable
    - anthropic package: pip install anthropic
"""

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    import anthropic

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
RESULTS_DIR = SCRIPT_DIR / "results"
TEST_CASES_DIR = SCRIPT_DIR / "test_cases"

# Skill directories
SKILLS = ["trend-scout", "creator-pulse", "briefing-bot", "portfolio-scout", "momentum-trader"]


def load_skill_md(skill: str) -> str:
    """Load SKILL.md content for a skill."""
    skill_path = PROJECT_ROOT / skill / "SKILL.md"
    if not skill_path.exists():
        raise FileNotFoundError(f"SKILL.md not found: {skill_path}")
    return skill_path.read_text()


def load_test_cases(skill: str) -> list[dict[str, Any]]:
    """Load test cases for a skill."""
    # Convert skill name to filename (briefing-bot -> briefing_bot.jsonl)
    filename = skill.replace("-", "_") + ".jsonl"
    test_path = TEST_CASES_DIR / filename
    if not test_path.exists():
        raise FileNotFoundError(f"Test cases not found: {test_path}")
    
    cases = []
    for line in test_path.read_text().strip().split("\n"):
        if line.strip():
            cases.append(json.loads(line))
    return cases


def get_assertions(skill: str) -> list:
    """Get assertion functions for a skill."""
    from assertions import SHARED_ASSERTIONS, SKILL_ASSERTIONS
    
    skill_specific = SKILL_ASSERTIONS.get(skill, [])
    return SHARED_ASSERTIONS + skill_specific


def run_skill(client: "anthropic.Anthropic", skill_md: str, user_input: str) -> str:
    """Run the skill against a user input and return the output."""
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=800,
        system=f"""You are an AI agent with the following skill installed. Use this skill to respond to the user's request.

{skill_md}

Respond as if you are executing this skill. Generate realistic output based on the skill's instructions.""",
        messages=[{"role": "user", "content": user_input}]
    )
    return response.content[0].text


def evaluate_output(output: str, assertions: list, context: dict | None = None) -> dict[str, bool]:
    """Run all assertions against an output."""
    results = {}
    for assertion in assertions:
        name = assertion.__name__
        try:
            # Some assertions take context
            import inspect
            sig = inspect.signature(assertion)
            if "context" in sig.parameters:
                results[name] = assertion(output, context)
            else:
                results[name] = assertion(output)
        except Exception as e:
            print(f"  Warning: {name} raised {e}")
            results[name] = False
    return results


def evaluate_skill(skill: str, dry_run: bool = False, verbose: bool = False) -> dict:
    """Evaluate a skill against all its test cases."""
    print(f"\n{'='*60}")
    print(f"Evaluating: {skill}")
    print(f"{'='*60}")
    
    # Load skill and test cases
    skill_md = load_skill_md(skill)
    test_cases = load_test_cases(skill)
    assertions = get_assertions(skill)
    
    print(f"  Loaded SKILL.md: {len(skill_md)} chars")
    print(f"  Test cases: {len(test_cases)}")
    print(f"  Assertions: {len(assertions)} ({len([a for a in assertions if 'shared' not in a.__module__])} skill-specific)")
    
    if dry_run:
        print("\n  [DRY RUN] Would evaluate these test cases:")
        for case in test_cases:
            print(f"    - {case['id']}: {case['input'][:50]}...")
        return {"skill": skill, "dry_run": True, "test_cases": len(test_cases)}
    
    # Initialize API client
    client = anthropic.Anthropic()
    
    # Run evaluations
    results = []
    passed = 0
    
    for i, case in enumerate(test_cases):
        case_id = case["id"]
        user_input = case["input"]
        context = case.get("context", {})
        
        print(f"\n  [{i+1}/{len(test_cases)}] {case_id}")
        if verbose:
            print(f"      Input: {user_input}")
        
        try:
            output = run_skill(client, skill_md, user_input)
            assertion_results = evaluate_output(output, assertions, context)
            
            case_passed = all(assertion_results.values())
            if case_passed:
                passed += 1
                print(f"      PASS")
            else:
                failed = [k for k, v in assertion_results.items() if not v]
                print(f"      FAIL: {', '.join(failed)}")
            
            results.append({
                "id": case_id,
                "input": user_input,
                "passed": case_passed,
                "assertions": assertion_results,
                "output_preview": output[:200] + "..." if len(output) > 200 else output,
            })
            
        except Exception as e:
            print(f"      ERROR: {e}")
            results.append({
                "id": case_id,
                "input": user_input,
                "passed": False,
                "assertions": {},
                "error": str(e),
            })
    
    # Calculate pass rate
    pass_rate = passed / len(test_cases) if test_cases else 0
    
    print(f"\n  Pass rate: {pass_rate:.1%} ({passed}/{len(test_cases)})")
    
    # Build result object
    run_result = {
        "skill": skill,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "pass_rate": pass_rate,
        "total_cases": len(test_cases),
        "passed": passed,
        "failed": len(test_cases) - passed,
        "results": results,
        "failures": [r for r in results if not r["passed"]],
    }
    
    return run_result


def save_results(result: dict, skill: str):
    """Save evaluation results."""
    RESULTS_DIR.mkdir(exist_ok=True)
    
    # Save latest run
    latest_path = RESULTS_DIR / "latest_run.json"
    latest_path.write_text(json.dumps(result, indent=2))
    print(f"\n  Saved: {latest_path}")
    
    # Update scores history
    scores_path = RESULTS_DIR / "scores.json"
    if scores_path.exists():
        scores = json.loads(scores_path.read_text())
    else:
        scores = {}
    
    if skill not in scores:
        scores[skill] = []
    
    scores[skill].append({
        "timestamp": result["timestamp"],
        "pass_rate": result["pass_rate"],
        "version": f"v{len(scores[skill]) + 1}",
    })
    
    scores_path.write_text(json.dumps(scores, indent=2))
    print(f"  Updated: {scores_path}")


def main():
    parser = argparse.ArgumentParser(description="Evaluate Zora agent skills")
    parser.add_argument("skill", nargs="?", help="Skill to evaluate (e.g., briefing-bot)")
    parser.add_argument("--all", action="store_true", help="Evaluate all skills")
    parser.add_argument("--dry-run", action="store_true", help="Show what would run without API calls")
    parser.add_argument("--verbose", "-v", action="store_true", help="Show detailed output")
    
    args = parser.parse_args()
    
    if not args.skill and not args.all:
        parser.print_help()
        print(f"\nAvailable skills: {', '.join(SKILLS)}")
        sys.exit(1)
    
    # Check for API key and import anthropic
    if not args.dry_run:
        if not os.environ.get("ANTHROPIC_API_KEY"):
            print("Error: ANTHROPIC_API_KEY environment variable required")
            sys.exit(1)
        try:
            global anthropic
            import anthropic as _anthropic
            anthropic = _anthropic
        except ImportError:
            print("Error: anthropic package required. Install with: pip install anthropic")
            sys.exit(1)
    
    skills_to_run = SKILLS if args.all else [args.skill]
    
    # Validate skill names
    for skill in skills_to_run:
        if skill not in SKILLS:
            print(f"Error: Unknown skill '{skill}'. Available: {', '.join(SKILLS)}")
            sys.exit(1)
    
    # Run evaluations
    all_results = {}
    for skill in skills_to_run:
        try:
            result = evaluate_skill(skill, dry_run=args.dry_run, verbose=args.verbose)
            all_results[skill] = result
            
            if not args.dry_run:
                save_results(result, skill)
                
        except Exception as e:
            print(f"\nError evaluating {skill}: {e}")
            if args.verbose:
                import traceback
                traceback.print_exc()
    
    # Summary
    if args.all and not args.dry_run:
        print(f"\n{'='*60}")
        print("Summary")
        print(f"{'='*60}")
        for skill, result in all_results.items():
            print(f"  {skill}: {result['pass_rate']:.1%}")


if __name__ == "__main__":
    main()
