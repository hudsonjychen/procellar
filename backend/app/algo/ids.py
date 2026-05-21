"""Canonical event id strings for consistent set membership across pm4py / JSON / pandas."""
from typing import Any, Hashable, Iterable, Optional, Set

import pandas as pd


def canonical_event_id(value: Any) -> Optional[str]:
    if value is None:
        return None
    try:
        if pd.isna(value):
            return None
    except TypeError:
        pass
    s = str(value).strip()
    return s or None


def canonical_event_id_set(ids: Iterable[Any]) -> Set[str]:
    out: Set[str] = set()
    for x in ids or []:
        sx = canonical_event_id(x)
        if sx is not None:
            out.add(sx)
    return out


def event_id_in_set(event_id: Any, id_set: Set[str]) -> bool:
    sx = canonical_event_id(event_id)
    return sx is not None and sx in id_set
