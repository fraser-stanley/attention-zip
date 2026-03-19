"""
Shared assertions that apply to all Zora agent skills.
Each function returns True (pass) or False (fail).
"""

import re
from typing import Callable

# Valid CLI commands from CLAUDE.md
VALID_COMMANDS = {
    "zora auth",
    "zora explore",
    "zora get",
    "zora buy",
    "zora sell",
    "zora balances",
    "zora setup",
    "zora wallet",
}

VALID_EXPLORE_SORTS = {"mcap", "volume", "new", "gainers", "trending", "featured", "last-traded", "last-traded-unique"}
VALID_EXPLORE_TYPES = {"all", "trend", "creator-coin", "post"}


def assert_no_raw_json(output: str) -> bool:
    """Output is prose, not raw JSON dumped to user."""
    # Check for obvious JSON patterns that shouldn't be in user-facing output
    json_patterns = [
        r'^\s*\{',  # Starts with {
        r'^\s*\[',  # Starts with [
        r'"address"\s*:',  # JSON key patterns
        r'"marketCap"\s*:',
        r'"volume24h"\s*:',
        r'"error"\s*:.*"suggestion"\s*:',  # Raw error JSON
    ]
    for pattern in json_patterns:
        if re.search(pattern, output, re.MULTILINE):
            # Allow if it's in a code block (teaching the command)
            if "```" in output and re.search(r'```(?:json|bash)?\s*\n.*' + pattern, output, re.DOTALL):
                continue
            return False
    return True


def assert_no_hallucinated_commands(output: str) -> bool:
    """Only references documented CLI commands."""
    # Extract all zora commands mentioned
    zora_commands = re.findall(r'zora\s+(\w+)', output.lower())
    valid_subcommands = {"auth", "explore", "get", "buy", "sell", "balances", "setup", "wallet"}
    
    for cmd in zora_commands:
        if cmd not in valid_subcommands:
            return False
    
    # Check for hallucinated flags
    hallucinated_flags = [
        "--watch",  # No streaming mode
        "--address",  # balances has no address arg
        "--ens",  # ENS not supported
        "--stream",
        "--subscribe",
        "zora install",  # No install command
        "zora skills",  # No skills command
    ]
    for flag in hallucinated_flags:
        if flag in output.lower():
            return False
    
    return True


def assert_concise(output: str, max_words: int = 300) -> bool:
    """Output is under word limit."""
    word_count = len(output.split())
    return word_count <= max_words


def assert_no_sensitive_data(output: str) -> bool:
    """No private keys, secrets, or PII patterns."""
    sensitive_patterns = [
        r'0x[a-fA-F0-9]{64}',  # Private key pattern
        r'ZORA_PRIVATE_KEY\s*=\s*\S+',  # Env var with value
        r'wallet\.json.*private',  # Wallet file content
        r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',  # Email (if not example)
    ]
    for pattern in sensitive_patterns:
        if re.search(pattern, output):
            return False
    return True


def assert_actionable(output: str) -> bool:
    """Includes concrete next step or insight."""
    # Look for action signals
    action_signals = [
        r'\b(run|execute|check|use|try|configure|install)\b',
        r'\bzora\s+\w+',  # CLI command
        r'address:\s*0x',  # Contract address to interact with
        r'\$[\d,.]+[KMB]?\s*(mcap|volume)',  # Market data point
        r'[+-]?\d+\.?\d*%',  # Percentage change
    ]
    for signal in action_signals:
        if re.search(signal, output, re.IGNORECASE):
            return True
    return False


def assert_has_structure(output: str) -> bool:
    """Output has some organizational structure (headers, lists, or clear sections)."""
    structure_signals = [
        r'^#+\s',  # Markdown headers
        r'^\d+\.',  # Numbered list
        r'^[-*]\s',  # Bullet list
        r'\n\n',  # Paragraph breaks
        r':\s*\n',  # Label followed by newline
    ]
    matches = sum(1 for signal in structure_signals if re.search(signal, output, re.MULTILINE))
    return matches >= 2


def assert_mentions_coin_data(output: str) -> bool:
    """For market-related skills, mentions actual coin metrics."""
    coin_data_signals = [
        r'\$[\d,.]+[KMB]?',  # Dollar amounts
        r'mcap|market\s*cap',
        r'volume',
        r'0x[a-fA-F0-9]{4,}',  # Contract address (at least partial)
        r'[+-]?\d+\.?\d*%',  # Percentage
    ]
    matches = sum(1 for signal in coin_data_signals if re.search(signal, output, re.IGNORECASE))
    return matches >= 2


def assert_not_empty(output: str) -> bool:
    """Output is not empty or trivially short."""
    stripped = output.strip()
    return len(stripped) > 50


def assert_no_apologies(output: str) -> bool:
    """Output doesn't start with unnecessary apologies or hedging."""
    apology_patterns = [
        r'^(i\'m sorry|sorry|apologies|unfortunately|i cannot|i can\'t)',
        r'^(as an ai|as a language model)',
    ]
    for pattern in apology_patterns:
        if re.search(pattern, output.lower().strip()):
            return False
    return True


# Export all shared assertions
SHARED_ASSERTIONS: list[Callable[[str], bool]] = [
    assert_no_raw_json,
    assert_no_hallucinated_commands,
    assert_no_sensitive_data,
    assert_not_empty,
    assert_no_apologies,
]
