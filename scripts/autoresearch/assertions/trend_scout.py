"""
Binary assertions for Trend Scout skill.
Each function returns True (pass) or False (fail).
"""

import re
from typing import Callable


def assert_includes_rankings(output: str) -> bool:
    """Output presents coins in ranked order (1, 2, 3 or similar)."""
    ranking_patterns = [
        r'^\s*[1-9]\.',  # Numbered list
        r'#[1-9]',
        r'(first|second|third|top)\s+\d*',
        r'\btop\s+\d+\b',
    ]
    for pattern in ranking_patterns:
        if re.search(pattern, output, re.MULTILINE | re.IGNORECASE):
            return True
    return False


def assert_includes_market_cap(output: str) -> bool:
    """Mentions market cap for listed coins."""
    mcap_patterns = [
        r'\$[\d,.]+[KMB]?\s*mcap',
        r'market\s*cap[:\s]+\$',
        r'mcap[:\s]+\$',
    ]
    for pattern in mcap_patterns:
        if re.search(pattern, output, re.IGNORECASE):
            return True
    return False


def assert_includes_change_percent(output: str) -> bool:
    """Shows 24h change percentage."""
    change_patterns = [
        r'[+-]?\d+\.?\d*%\s*(24h|1d|daily)?',
        r'(up|down)\s+\d+\.?\d*%',
        r'24h[:\s]+[+-]?\d+',
    ]
    for pattern in change_patterns:
        if re.search(pattern, output, re.IGNORECASE):
            return True
    return False


def assert_includes_addresses(output: str) -> bool:
    """Includes contract addresses (full or truncated)."""
    address_patterns = [
        r'0x[a-fA-F0-9]{8,}',  # At least partial address
        r'address[:\s]+0x',
        r'0x[a-fA-F0-9]{4}\.{2,3}[a-fA-F0-9]{4}',  # Truncated format
    ]
    for pattern in address_patterns:
        if re.search(pattern, output, re.IGNORECASE):
            return True
    return False


def assert_matches_sort_intent(output: str, context: dict | None = None) -> bool:
    """Output matches the requested sort type from context."""
    if not context or "sort" not in context:
        return True  # No sort specified, pass by default
    
    sort_type = context["sort"]
    sort_signals = {
        "trending": [r'\btrending\b', r'\bmomentum\b', r'\bhot\b'],
        "new": [r'\bnew\b', r'\blaunch', r'\brecent'],
        "volume": [r'\bvolume\b', r'\btrading\b', r'\bactiv'],
        "mcap": [r'\bmarket\s*cap\b', r'\blargest\b', r'\bbiggest\b'],
    }
    
    if sort_type in sort_signals:
        for pattern in sort_signals[sort_type]:
            if re.search(pattern, output, re.IGNORECASE):
                return True
        return False
    return True


def assert_reasonable_count(output: str) -> bool:
    """Lists a reasonable number of coins (not 0, not 50)."""
    # Count numbered items or coin mentions
    numbered = len(re.findall(r'^\s*\d+\.', output, re.MULTILINE))
    if 1 <= numbered <= 20:
        return True
    
    # Fallback: count address mentions
    addresses = len(re.findall(r'0x[a-fA-F0-9]{4,}', output))
    return 1 <= addresses <= 20


def assert_explains_data_source(output: str) -> bool:
    """Mentions this is Zora/Base data (not generic crypto)."""
    source_patterns = [
        r'\bzora\b',
        r'\bbase\b',
        r'8453',  # Base chain ID
    ]
    for pattern in source_patterns:
        if re.search(pattern, output, re.IGNORECASE):
            return True
    return False


# Skill-specific assertions for Trend Scout
TREND_SCOUT_ASSERTIONS: list[Callable[[str], bool]] = [
    assert_includes_rankings,
    assert_includes_market_cap,
    assert_includes_change_percent,
    assert_includes_addresses,
    assert_reasonable_count,
]
