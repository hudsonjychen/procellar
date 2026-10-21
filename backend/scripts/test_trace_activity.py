"""Quick diagnostic for activity-based trace matching."""
import json
import os
import sys
import tempfile

import pm4py

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.algo.match import match_events  # noqa: E402
from app.algo.trace import TraceRule  # noqa: E402

ocel_json = {
    "objectTypes": [{"name": "order", "attributes": []}],
    "objects": [{"id": "o1", "type": "order", "attributes": []}],
    "events": [
        {
            "id": "e1",
            "type": "Create",
            "time": "2020-01-01T00:00:00+00:00",
            "attributes": [],
            "relationships": [{"objectId": "o1", "qualifier": ""}],
        },
        {
            "id": "e2",
            "type": "Ship",
            "time": "2020-01-02T00:00:00+00:00",
            "attributes": [],
            "relationships": [{"objectId": "o1", "qualifier": ""}],
        },
    ],
    "version": "2.0",
}

with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False, encoding="utf-8") as f:
    json.dump(ocel_json, f)
    path = f.name

log = pm4py.read_ocel2_json(path)
os.remove(path)

print("event_id_column:", log.event_id_column)
print("event_activity:", log.event_activity)
print("events columns:", list(log.events.columns))
print(log.events)
print("relations columns:", list(log.relations.columns))

start = [{"objectTypes": [], "activity": "Create"}]
end = [{"objectTypes": [], "activity": "Ship"}]

m_start = match_events(log, start, match_type="start")
m_end = match_events(log, end, match_type="end")
print("match start:", m_start)
print("match end:", m_end)

tr = TraceRule("p", "t", start, end)
print("trace ids:", tr.get_traces(log))
