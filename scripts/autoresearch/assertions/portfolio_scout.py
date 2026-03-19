"""
Binary assertions for Portfolio Scout skill.
Each function returns True (pass) or False (fail).
"""

import re
from typing import Callable


def assert_shows_token_balances(output: str) -> bool:
    """Shows actual token quantities held."""
    balance_patterns = [
        r'\d+[\d,]*\s*tokens?',
        r'balance[:\s]+\d',
        r'holding[s]?[:\s]+\d',
    ]
    for pattern in balance_patterns:
        if re.search(pattern, output, re.IGNORECASE):
            return True
    return False


def assert_shows_usd_values(output: str) -> bool:
    """Includes USD value for holdings."""
    usd_patterns = [
        r'value[:\s]+\$[\d,.]+',
        r'\$[\d,.]+[KMB]?\s*(value|worth)',
        r'worth[:\s]+\$',
    ]
    for pattern in usd_patterns:
        if re.search(pattern, output, re.IGNORECASE):
            return True
    return False


def assert_shows_total_value(output: str) -> bool:
    """Includes total portfolio value."""
    total_patterns = [
        r'total[:\s]+[\$~]?[\d,.]+',
        r'portfolio\s+value[:\s]+\$',
        r'~\$[\d,.]+[KMB]?\s*total',
        r'total\s+(value|worth)',
    ]
    for pattern in total_patterns:
        if re.search(pattern, output, re.IGNORECASE):
            return True
    return False


def assert_identifies_coin_types(output: str) -> bool:
    """Labels coin types (CREATOR, CONTENT, etc.)."""
    type_patterns = [
        r'\(CREATOR\)',
        r'\(CONTENT\)',
        r'\(TREND\)',
        r'creator[- ]?coin',
        r'content\s+coin',
    ]
    for pattern in type_patterns:
        if re.search(pattern, output, re.IGNORECASE):
            return True
    return False


def assert_clarifies_local_wallet(output: str) -> bool:
    """Makes clear this is the local wallet, not arbitrary address lookup."""
    wallet_patterns = [
        r'local\s+wallet',
        r'your\s+wallet',
        r'configured\s+wallet',
        r'your\s+holdings?',
        r'your\s+coins?',
    ]
    for pattern in wallet_patterns:
        if re.search(pattern, output, re.IGNORECASE):
            return True
    return False


def assert_no_native_token_promises(output: str) -> bool:
    """Doesn't promise ETH/USDC/ZORA balances (CLI doesn't return these)."""
    # If mentioning native tokens, should be a disclaimer not a promise
    native_mentions = re.findall(r'\b(ETH|USDC|ZORA)\s+balance', output, re.IGNORECASE)
    if native_mentions:
        # Check if it's a disclaimer
        disclaimer_patterns = [
            r'(not|doesn\'t|does not)\s+(include|show|return)',
            r'only.*coin\s+holdings',
            r'exclud',
        ]
        for pattern in disclaimer_patterns:
            if re.search(pattern, output, re.IGNORECASE):
                return True
        return False
    return True


def assert_handles_empty_portfolio(output: str, context: dict | None = None) -> bool:
    """Gracefully handles empty portfolio case."""
    if not context or not context.get("empty_portfolio"):
        return True  # Not an empty portfolio test case
    
    empty_patterns = [
        r'no\s+(coins?|holdings?|tokens?)',
        r'empty',
        r'0\s+coins?',
        r'nothing\s+(held|found)',
    ]
    for pattern in empty_patterns:
        if re.search(pattern, output, re.IGNORECASE):
            return True
    return False


def assert_shows_change_percent(output: str) -> bool:
    """Shows 24h change for holdings."""
    change_patterns = [
        r'[+-]?\d+\.?\d*%\s*(24h)?',
        r'24h[:\s]+[+-]?\d+',
        r'(up|down)\s+\d+',
    ]
    for pattern in change_patterns:
        if re.search(pattern, output, re.IGNORECASE):
            return True
    return False


# Skill-specific assertions for Portfolio Scout
PORTFOLIO_SCOUT_ASSERTIONS: list[Callable[[str], bool]] = [
    assert_shows_token_balances,
    assert_shows_usd_values,
    assert_shows_total_value,
    assert_identifies_coin_types,
    assert_clarifies_local_wallet,
    assert_no_native_token_promises,
]
