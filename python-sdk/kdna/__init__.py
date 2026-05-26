"""
KDNA Python SDK — Load KDNA dev source workspaces for AI agents.

Usage:
    from kdna import load_dev_source, format_context

    domain = load_dev_source("./sales-source")
    context = format_context(domain)
"""

from .loader import load_dev_source, classify_input
from .context import format_context

__version__ = "0.4.0"
__all__ = ["load_dev_source", "format_context", "classify_input"]
