"""
KDNA Python SDK — Load domain cognition for AI agents.

Usage:
    from kdna import load_domain, format_context

    domain = load_domain("./sales")
    context = format_context(domain)
"""

from .loader import load_domain, classify_input
from .context import format_context

__version__ = "0.4.0"
__all__ = ["load_domain", "format_context", "classify_input"]
