"""
Assertion modules for Zora agent skill evaluation.
"""

from .shared import SHARED_ASSERTIONS
from .briefing_bot import BRIEFING_BOT_ASSERTIONS
from .trend_scout import TREND_SCOUT_ASSERTIONS
from .creator_pulse import CREATOR_PULSE_ASSERTIONS
from .portfolio_scout import PORTFOLIO_SCOUT_ASSERTIONS
from .momentum_trader import MOMENTUM_TRADER_ASSERTIONS

SKILL_ASSERTIONS = {
    "briefing-bot": BRIEFING_BOT_ASSERTIONS,
    "trend-scout": TREND_SCOUT_ASSERTIONS,
    "creator-pulse": CREATOR_PULSE_ASSERTIONS,
    "portfolio-scout": PORTFOLIO_SCOUT_ASSERTIONS,
    "momentum-trader": MOMENTUM_TRADER_ASSERTIONS,
}

__all__ = [
    "SHARED_ASSERTIONS",
    "SKILL_ASSERTIONS",
    "BRIEFING_BOT_ASSERTIONS",
    "TREND_SCOUT_ASSERTIONS",
    "CREATOR_PULSE_ASSERTIONS",
    "PORTFOLIO_SCOUT_ASSERTIONS",
    "MOMENTUM_TRADER_ASSERTIONS",
]
