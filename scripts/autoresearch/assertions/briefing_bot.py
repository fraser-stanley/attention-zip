"""
Binary assertions for Briefing Bot skill.
Each function returns True (pass) or False (fail).
"""

import re
from typing import Callable


def assert_has_market_assessment(output: str) -> bool:
    """Ends with a plain-language market assessment."""
    assessment_patterns = [
        r'market\s+is\s+(quiet|active|volatile|moderate)',
        r'nothing\s+unusual',
        r'notable\s+signal',
        r'watch\s+for',
        r'(bullish|bearish|neutral)\s+sentiment',
    ]
    # Check last 100 chars for assessment
    tail = output[-200:].lower()
    for pattern in assessment_patterns:
        if re.search(pattern, tail):
            return True
    return False


def assert_has_date_header(output: str) -> bool:
    """Includes date/time context in header."""
    date_patterns = [
        r'(morning|evening|daily)\s+briefing',
        r'(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}',
        r'\d{4}-\d{2}-\d{2}',
        r'(today|yesterday|overnight)',
    ]
    # Check first 150 chars for date header
    head = output[:150].lower()
    for pattern in date_patterns:
        if re.search(pattern, head):
            return True
    return False


def assert_covers_multiple_sections(output: str) -> bool:
    """Covers at least 3 of: trending, volume, new, gainers, creators."""
    sections = [
        r'\btrending\b',
        r'\bvolume\b',
        r'\bnew\s+(coins?|launches?)\b',
        r'\bgainers?\b',
        r'\bcreator\s+coins?\b',
    ]
    matches = sum(1 for s in sections if re.search(s, output, re.IGNORECASE))
    return matches >= 3


def assert_under_word_limit(output: str) -> bool:
    """Briefing is concise — under 200 words as specified."""
    return len(output.split()) <= 200


def assert_mentions_specific_coins(output: str) -> bool:
    """Names at least one specific coin (not just categories)."""
    # Look for quoted names or names followed by metrics
    coin_patterns = [
        r'"[^"]+"\s*(leads?|at|\$)',
        r'\b[a-z]+\s+(leads?|at|—|–|-)\s*\$',
        r'\$[\d,.]+[KMB]?\s*mcap',
    ]
    for pattern in coin_patterns:
        if re.search(pattern, output, re.IGNORECASE):
            return True
    return False


def assert_no_empty_sections(output: str) -> bool:
    """Doesn't include sections with no data (should omit them)."""
    empty_section_patterns = [
        r'no\s+(data|results|activity)\s+(available|found)',
        r'section\s+is\s+empty',
        r':\s*none\s*\n',
        r':\s*n/a\s*\n',
    ]
    for pattern in empty_section_patterns:
        if re.search(pattern, output, re.IGNORECASE):
            return False
    return True


def assert_uses_compact_format(output: str) -> bool:
    """Uses compact currency format ($1.2M not $1,200,000)."""
    # Check for verbose number formats that should be compact
    verbose_patterns = [
        r'\$\d{1,3}(,\d{3}){2,}',  # $1,000,000 style
        r'\$\d{7,}',  # $1000000 style (7+ digits without commas)
    ]
    for pattern in verbose_patterns:
        if re.search(pattern, output):
            return False
    return True


# Skill-specific assertions for Briefing Bot
BRIEFING_BOT_ASSERTIONS: list[Callable[[str], bool]] = [
    assert_has_market_assessment,
    assert_has_date_header,
    assert_covers_multiple_sections,
    assert_under_word_limit,
    assert_mentions_specific_coins,
    assert_no_empty_sections,
    assert_uses_compact_format,
]
