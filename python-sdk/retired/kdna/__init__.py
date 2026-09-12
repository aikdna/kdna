"""
KDNA Python SDK — Load canonical `.kdna` judgment assets for AI agents.

Usage:
    from kdna import open_kdna, format_context

    capsule = open_kdna("./writing.kdna")
    context = format_context(capsule)
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

__version__ = "0.5.0"
__all__ = [
    "KDNAAssetError",
    "open_kdna",
    "inspect_kdna",
    "verify_digest",
    "load_dev_source",
    "format_context",
    "classify_input",
]
