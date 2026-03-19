"""
Binary assertions for Creator Pulse skill.
Each function returns True (pass) or False (fail).
"""

import re
from typing import Callable


def assert_identifies_creator_coins(output: str) -> bool:
    """Clearly identifies coins as creator coins."""
    creator_patterns = [
        r'\bcreator[- ]?coin',
        r'\(creator\)',
        r'\(CREATOR\)',
        r'creator:\s+\w+',
    ]
    for pattern in creator_patterns:
        if re.search(pattern, output, re.IGNORECASE):
            return True
    return False


def assert_includes_holder_count(output: str) -> bool:
    """Mentions holder counts for creator coins."""
    holder_patterns = [
        r'\bholders?[:\s]+[\d,]+',
        r'[\d,]+\s+holders?',
        r'unique\s*holders?',
    ]
    for pattern in holder_patterns:
        if re.search(pattern, output, re.IGNORECASE):
            return True
    return False


def assert_includes_volume(output: str) -> bool:
    """Shows volume data."""
    volume_patterns = [
        r'volume[:\s]+\$[\d,.]+',
        r'\$[\d,.]+[KMB]?\s*(vol|volume)',
        r'24h\s*vol',
    ]
    for pattern in volume_patterns:
        if re.search(pattern, output, re.IGNORECASE):
            return True
    return False


def assert_names_creators(output: str) -> bool:
    """Names specific creators (not just "top creators")."""
    # Look for patterns like "jacob", "alysaliu" followed by metrics
    # or creator names in a list format
    naming_patterns = [
        r'\b[a-z]{3,}\s*\(creator',  # name (creator-coin)
        r'^\s*\d+\.\s+[a-z]+',  # 1. jacob
        r'@[a-z]+',  # @handle
    ]
    for pattern in naming_patterns:
        if re.search(pattern, output, re.MULTILINE | re.IGNORECASE):
            return True
    return False


def assert_watchlist_actionable(output: str, context: dict | None = None) -> bool:
    """If watchlist-related, provides actionable alerts or comparison."""
    if not context or context.get("intent") != "watchlist":
        return True  # Not a watchlist request, pass
    
    watchlist_patterns = [
        r'alert',
        r'spike',
        r'increase',
        r'change',
        r'since\s+(last|yesterday)',
        r'compared\s+to',
    ]
    for pattern in watchlist_patterns:
        if re.search(pattern, output, re.IGNORECASE):
            return True
    return False


def assert_no_confused_types(output: str) -> bool:
    """Doesn't confuse creator coins with content/trend coins."""
    # Check for contradictory type labels
    confused_patterns = [
        r'creator\s+coin.*\(content\)',
        r'creator\s+coin.*\(trend\)',
        r'\(CONTENT\).*creator\s+coin',
    ]
    for pattern in confused_patterns:
        if re.search(pattern, output, re.IGNORECASE):
            return False
    return True


def assert_featured_context(output: str, context: dict | None = None) -> bool:
    """If asking for featured creators, explains curation."""
    if not context or context.get("sort") != "featured":
        return True  # Not a featured request, pass
    
    featured_patterns = [
        r'featured',
        r'curated',
        r'highlighted',
        r'zora.*select',
    ]
    for pattern in featured_patterns:
        if re.search(pattern, output, re.IGNORECASE):
            return True
    return False


# Skill-specific assertions for Creator Pulse
CREATOR_PULSE_ASSERTIONS: list[Callable[[str], bool]] = [
    assert_identifies_creator_coins,
    assert_includes_holder_count,
    assert_includes_volume,
    assert_names_creators,
    assert_no_confused_types,
]
