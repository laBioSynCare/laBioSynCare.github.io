"""SSTIM: validate sensory-stimulation descriptions against a published profile.

    import sstim
    report = sstim.validate("my-stimulus.ttl", profile="core")
    print(report)

With no version, the newest frozen release is resolved from the stable IRI, so
what you validated against is a thing you can name and re-fetch later. Pass
`version=` to pin explicitly.

To write a session record from a tool you already run, see `sstim.Session`.

SSTIM itself is at https://w3id.org/sstim. This package is a client for it, not
the standard: the ontology, its shapes and its profiles are published
independently and this code only reads them.
"""

from ._resolve import (
    Closure,
    Module,
    SstimError,
    STABLE_IRI,
    TERM_NAMESPACE,
    cache_dir,
    latest_release,
    resolve_profile,
)
from ._session import Session, Signal
from ._validate import Report, validate

__all__ = [
    "Closure",
    "Module",
    "Report",
    "Session",
    "Signal",
    "SstimError",
    "STABLE_IRI",
    "TERM_NAMESPACE",
    "cache_dir",
    "latest_release",
    "resolve_profile",
    "validate",
]

__version__ = "0.2.0"
