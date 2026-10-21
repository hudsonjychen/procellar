from typing import List, Optional, Set, Tuple


class SelectorFormatError(ValueError):
    """Raised when a rule / trace definition does not match the selector format."""


def entity_name(value) -> Optional[str]:
    if value is None:
        return None
    s = str(value).strip()
    return s or None


def normalize_entity_selector(raw) -> Optional[dict]:
    """
    Normalize one selector ``{objectTypes: [...], activity: str | None}``.

    Returns ``None`` when the selector holds no entity. Raises ``SelectorFormatError``
    when several activities are given: a selector matches at most one activity.
    """
    if not isinstance(raw, dict):
        raise SelectorFormatError("Each selector must be an object")

    object_types: List[str] = []
    for ot in raw.get("objectTypes") or []:
        name = entity_name(ot)
        if name and name not in object_types:
            object_types.append(name)

    activity_raw = raw.get("activity")
    if isinstance(activity_raw, list):
        names = [n for n in (entity_name(a) for a in activity_raw) if n]
        if len(names) > 1:
            raise SelectorFormatError("A selector can contain at most one activity")
        activity = names[0] if names else None
    else:
        activity = entity_name(activity_raw)

    if not object_types and activity is None:
        return None
    return {"objectTypes": object_types, "activity": activity}


def normalize_selector_list(raw, field: str, owner: str = "") -> List[dict]:
    """Normalize a selector list, dropping selectors without any entity."""
    if raw is None:
        return []
    if not isinstance(raw, list):
        raise SelectorFormatError(f"{owner}'{field}' must be a list of selectors")
    selectors = [normalize_entity_selector(s) for s in raw]
    return [s for s in selectors if s is not None]


def selector_entities(*selector_lists) -> Tuple[Set[str], Set[str]]:
    """Object types and activities referenced by the given selector lists."""
    object_types: Set[str] = set()
    activities: Set[str] = set()
    for selectors in selector_lists:
        for selector in selectors or []:
            object_types.update(selector.get("objectTypes") or [])
            if selector.get("activity"):
                activities.add(selector["activity"])
    return object_types, activities


def selector_signature(selectors) -> Tuple[Tuple[Tuple[str, ...], Optional[str]], ...]:
    """Order-independent cache key for a selector list."""
    return tuple(
        sorted(
            (
                (tuple(sorted(s.get("objectTypes") or [])), s.get("activity"))
                for s in (selectors or [])
            ),
            # activity may be None, which is not comparable with str
            key=lambda item: (item[0], item[1] or ""),
        )
    )
