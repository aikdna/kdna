"""
KDNA Python SDK — Load canonical `.kdna` judgment assets for AI agents.

Usage:
    from kdna import open_kdna, format_context

    domain = open_kdna("./writing.kdna")
    context = format_context(domain)
"""

from .loader import (
    KDNAAssetError,
    classify_input,
    inspect_kdna,
    load_dev_source,
    open_kdna,
    verify_digest,
)
from .context import format_context

__version__ = "0.4.0"
__all__ = [
    "KDNAAssetError",
    "open_kdna",
    "inspect_kdna",
    "verify_digest",
    "load_dev_source",
    "format_context",
    "classify_input",
]
