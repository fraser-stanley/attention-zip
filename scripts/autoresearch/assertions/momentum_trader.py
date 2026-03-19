"""
Binary assertions for Momentum Trader skill.
Each function returns True (pass) or False (fail).
"""

import re
from typing import Callable


def assert_includes_risk_warning(output: str) -> bool:
    """Includes clear risk/execution warning."""
    risk_patterns = [
        r'real\s+(trades?|ETH|money)',
        r'no\s+(guardrails?|limits?|protection)',
        r'dedicated\s+wallet',
        r'trader\s+wallet',
        r'not\s+your\s+main',
        r'risk',
        r'caution',
    ]
    for pattern in risk_patterns:
        if re.search(pattern, output, re.IGNORECASE):
            return True
    return False


def assert_uses_quote_before_buy(output: str) -> bool:
    """Mentions --quote for dry-run before real trades."""
    quote_patterns = [
        r'--quote',
        r'dry[- ]?run',
        r'preview',
        r'estimate',
        r'before\s+(executing|buying|trading)',
    ]
    for pattern in quote_patterns:
        if re.search(pattern, output, re.IGNORECASE):
            return True
    return False


def assert_mentions_slippage(output: str) -> bool:
    """Discusses slippage as a trading consideration."""
    slippage_patterns = [
        r'slippage',
        r'price\s+impact',
        r'execution\s+price',
    ]
    for pattern in slippage_patterns:
        if re.search(pattern, output, re.IGNORECASE):
            return True
    return False


def assert_shows_position_tracking(output: str) -> bool:
    """Demonstrates position tracking (entry price, current value)."""
    position_patterns = [
        r'position',
        r'entry\s*(price)?',
        r'since\s+entry',
        r'balances',
        r'holdings?',
    ]
    for pattern in position_patterns:
        if re.search(pattern, output, re.IGNORECASE):
            return True
    return False


def assert_mentions_exit_strategy(output: str) -> bool:
    """Discusses exit criteria (stop loss, take profit, trailing)."""
    exit_patterns = [
        r'stop[- ]?loss',
        r'trailing\s+stop',
        r'take[- ]?profit',
        r'exit',
        r'sell\s+when',
        r'close\s+position',
    ]
    for pattern in exit_patterns:
        if re.search(pattern, output, re.IGNORECASE):
            return True
    return False


def assert_correct_flag_syntax(output: str) -> bool:
    """Uses correct flag syntax (-o json for buy/sell, --json for explore)."""
    # Check for incorrect patterns
    incorrect_patterns = [
        r'zora\s+buy.*--json',  # Should be -o json
        r'zora\s+sell.*--json',  # Should be -o json
        r'zora\s+explore.*-o\s+json',  # Should be --json
    ]
    for pattern in incorrect_patterns:
        if re.search(pattern, output, re.IGNORECASE):
            return False
    return True


def assert_mentions_wallet_setup(output: str) -> bool:
    """References wallet setup requirement."""
    setup_patterns = [
        r'zora\s+setup',
        r'wallet.*configur',
        r'private\s+key',
        r'~/.config/zora',
        r'ZORA_PRIVATE_KEY',
    ]
    for pattern in setup_patterns:
        if re.search(pattern, output, re.IGNORECASE):
            return True
    return False


def assert_shows_entry_criteria(output: str) -> bool:
    """Explains entry criteria for momentum signals."""
    criteria_patterns = [
        r'criteria',
        r'signal',
        r'threshold',
        r'min(imum)?\s+\d',
        r'\d+%\s+(gain|increase)',
        r'volume\s+>\s*\$',
    ]
    for pattern in criteria_patterns:
        if re.search(pattern, output, re.IGNORECASE):
            return True
    return False


def assert_no_guaranteed_returns(output: str) -> bool:
    """Doesn't promise specific returns or guaranteed profits."""
    promise_patterns = [
        r'guaranteed',
        r'will\s+(make|earn|profit)',
        r'always\s+(win|profit)',
        r'can\'t\s+lose',
        r'risk[- ]?free',
    ]
    for pattern in promise_patterns:
        if re.search(pattern, output, re.IGNORECASE):
            return False
    return True


def assert_mentions_cooldown(output: str) -> bool:
    """References cooldown between trades."""
    cooldown_patterns = [
        r'cooldown',
        r'wait\s+\d',
        r'between\s+(trades?|buys?)',
        r'min(ute)?s?\s+(between|before)',
    ]
    for pattern in cooldown_patterns:
        if re.search(pattern, output, re.IGNORECASE):
            return True
    return False


# Skill-specific assertions for Momentum Trader
MOMENTUM_TRADER_ASSERTIONS: list[Callable[[str], bool]] = [
    assert_includes_risk_warning,
    assert_uses_quote_before_buy,
    assert_mentions_slippage,
    assert_shows_position_tracking,
    assert_mentions_exit_strategy,
    assert_correct_flag_syntax,
    assert_no_guaranteed_returns,
]
