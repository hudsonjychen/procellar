"""Generate example-data/example-data-2.json."""
import json
import os

ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
OUT = os.path.join(ROOT, "example-data", "example-data-2.json")

PRODUCTS = [
    "Laptop", "Mouse", "Keyboard", "Monitor", "Webcam", "Tablet", "Headphones",
    "USB-C Hub", "SSD Drive", "Phone Case", "Docking Station", "Printer",
    "Scanner", "Router", "Speaker", "Microphone", "Graphics Tablet", "Smart Watch",
    "Power Bank", "Cable Kit", "Desk Lamp", "Ergo Chair", "Standing Desk",
    "External GPU", "NAS Drive", "Smart Plug", "Fitness Band", "E-Reader",
    "Action Camera", "Drone",
]

ORDERS = [
    {"id": "o1", "order_id": "ORD-2001", "items": ["i1", "i2", "i3"], "shipment": "s1", "invoices": ["inv1", "inv2"], "cancelled": False, "return_items": []},
    {"id": "o2", "order_id": "ORD-2002", "items": ["i4", "i5"], "shipment": "s1", "invoices": ["inv3"], "cancelled": False, "return_items": []},
    {"id": "o3", "order_id": "ORD-2003", "items": ["i6", "i7", "i8"], "shipment": "s2", "invoices": ["inv4"], "cancelled": False, "return_items": []},
    {"id": "o4", "order_id": "ORD-2004", "items": ["i9", "i10"], "shipment": None, "invoices": [], "cancelled": True, "return_items": []},
    {"id": "o5", "order_id": "ORD-2005", "items": ["i11", "i12"], "shipment": "s2", "invoices": ["inv5", "inv6"], "cancelled": False, "return_items": []},
    {"id": "o6", "order_id": "ORD-2006", "items": ["i13", "i14", "i15"], "shipment": "s3", "invoices": ["inv7"], "cancelled": False, "return_items": []},
    {"id": "o7", "order_id": "ORD-2007", "items": ["i16", "i17"], "shipment": "s3", "invoices": ["inv8"], "cancelled": False, "return_items": [("i16", "ret1")]},
    {"id": "o8", "order_id": "ORD-2008", "items": ["i18", "i19", "i20"], "shipment": "s4", "invoices": ["inv9", "inv10"], "cancelled": False, "return_items": [("i18", "ret2")]},
    {"id": "o9", "order_id": "ORD-2009", "items": ["i21", "i22"], "shipment": None, "invoices": [], "cancelled": True, "return_items": []},
    {"id": "o10", "order_id": "ORD-2010", "items": ["i23", "i24", "i25"], "shipment": "s5", "invoices": ["inv11"], "cancelled": False, "return_items": []},
    {"id": "o11", "order_id": "ORD-2011", "items": ["i26", "i27", "i28"], "shipment": "s6", "invoices": ["inv12", "inv13", "inv14"], "cancelled": False, "return_items": []},
    {"id": "o12", "order_id": "ORD-2012", "items": ["i29", "i30"], "shipment": "s7", "invoices": ["inv15", "inv16", "inv17"], "cancelled": False, "return_items": [("i29", "ret3")]},
]

SHIPMENTS = {
    "s1": {"tracking": "TRK-8001", "provider": "FastExpress"},
    "s2": {"tracking": "TRK-8002", "provider": "GlobalPost"},
    "s3": {"tracking": "TRK-8003", "provider": "FastExpress"},
    "s4": {"tracking": "TRK-8004", "provider": "QuickShip"},
    "s5": {"tracking": "TRK-8005", "provider": "GlobalPost"},
    "s6": {"tracking": "TRK-8006", "provider": "QuickShip"},
    "s7": {"tracking": "TRK-8007", "provider": "EuroLogistics"},
    "s8": {"tracking": "TRK-8008", "provider": "ReturnHub"},
}

RETURNS = {
    "ret1": {"rma": "RMA-9001", "reason": "Defective unit"},
    "ret2": {"rma": "RMA-9002", "reason": "Wrong item shipped"},
    "ret3": {"rma": "RMA-9003", "reason": "Customer changed mind"},
}


def _rels_order_items(order_id, item_ids):
    rels = [{"objectId": order_id, "qualifier": "order"}]
    rels.extend({"objectId": iid, "qualifier": "item"} for iid in item_ids)
    return rels


def _day(n):
    return f"2025-03-{n:02d}"


def build():
    objects = []
    events = []
    eid = 1

    def next_eid():
        nonlocal eid
        s = f"e{eid:03d}"
        eid += 1
        return s

    for idx, (iid, pname) in enumerate(zip([f"i{n}" for n in range(1, 31)], PRODUCTS), start=1):
        day = 1 + (idx - 1) // 6
        objects.append({
            "id": iid,
            "type": "item",
            "attributes": [{
                "name": "product-name",
                "time": f"{_day(day)}T08:00:00Z",
                "value": pname,
            }],
        })

    for ship_id, meta in SHIPMENTS.items():
        objects.append({
            "id": ship_id,
            "type": "shipment",
            "attributes": [{
                "name": "tracking-number",
                "time": "2025-03-10T10:00:00Z",
                "value": meta["tracking"],
            }],
        })

    for ret_id, meta in RETURNS.items():
        objects.append({
            "id": ret_id,
            "type": "return",
            "attributes": [{
                "name": "rma-id",
                "time": "2025-03-15T10:00:00Z",
                "value": meta["rma"],
            }],
        })

    inv_num = 1
    for oi, order in enumerate(ORDERS):
        oid = order["id"]
        base_day = 1 + oi // 2
        t_base = f"{_day(base_day)}T{8 + (oi % 4):02d}:00:00Z"

        objects.append({
            "id": oid,
            "type": "order",
            "attributes": [{
                "name": "order-id",
                "time": t_base,
                "value": order["order_id"],
            }],
        })

        item_rels = _rels_order_items(oid, order["items"])
        events.append({
            "id": next_eid(),
            "type": "create-order",
            "time": t_base,
            "attributes": [{"name": "total-items", "value": len(order["items"])}],
            "relationships": item_rels,
        })

        events.append({
            "id": next_eid(),
            "type": "order-confirmation",
            "time": t_base.replace(":00:00Z", ":05:00Z"),
            "attributes": [{"name": "confirmation-code", "value": f"CONF-{order['order_id'][-4:]}"}],
            "relationships": [{"objectId": oid, "qualifier": "order"}],
        })

        if order["cancelled"]:
            events.append({
                "id": next_eid(),
                "type": "order-cancelled",
                "time": t_base.replace(":00:00Z", ":30:00Z"),
                "attributes": [{"name": "reason", "value": "Customer requested cancellation"}],
                "relationships": [{"objectId": oid, "qualifier": "order"}],
            })
            continue

        for inv_id in order["invoices"]:
            objects.append({
                "id": inv_id,
                "type": "invoice",
                "attributes": [{
                    "name": "invoice-number",
                    "time": t_base.replace(":00:00Z", ":10:00Z"),
                    "value": f"INV-{2000 + inv_num}",
                }],
            })
            inv_num += 1
            events.append({
                "id": next_eid(),
                "type": "invoice-issued",
                "time": t_base.replace(":00:00Z", f":{10 + order['invoices'].index(inv_id) * 5:02d}:00Z"),
                "attributes": [{"name": "amount", "value": 49.99 + inv_num}],
                "relationships": [
                    {"objectId": oid, "qualifier": "order"},
                    {"objectId": inv_id, "qualifier": "invoice"},
                ],
            })

        pack_time = t_base.replace("T", "T").split("T")[0] + "T14:00:00Z"
        events.append({
            "id": next_eid(),
            "type": "package-prepared",
            "time": pack_time,
            "attributes": [{"name": "warehouse-id", "value": f"WH-{['NORTH', 'EAST', 'SOUTH', 'WEST'][oi % 4]}"}],
            "relationships": item_rels,
        })

        ship_id = order["shipment"]
        provider = SHIPMENTS[ship_id]["provider"]
        ship_start = pack_time.replace("T14:", "T16:").replace("-0", "-1", 1) if base_day < 10 else pack_time.replace("14:", "16:")
        # simpler: offset day for shipment
        ship_day = min(base_day + 1, 20)
        ship_start = f"{_day(ship_day)}T10:00:00Z"
        ship_end = f"{_day(ship_day + 1)}T15:00:00Z"

        events.append({
            "id": next_eid(),
            "type": "shipment-started",
            "time": ship_start,
            "attributes": [{"name": "logistics-provider", "value": provider}],
            "relationships": [
                {"objectId": oid, "qualifier": "order"},
                {"objectId": ship_id, "qualifier": "shipment"},
            ],
        })
        events.append({
            "id": next_eid(),
            "type": "shipment-delivered",
            "time": ship_end,
            "attributes": [{"name": "recipient", "value": f"Customer-{oi + 1}"}],
            "relationships": [
                {"objectId": oid, "qualifier": "order"},
                {"objectId": ship_id, "qualifier": "shipment"},
            ],
        })

        for item_id, ret_id in order["return_items"]:
            ret_day = ship_day + 2
            events.append({
                "id": next_eid(),
                "type": "return-initiated",
                "time": f"{_day(ret_day)}T09:00:00Z",
                "attributes": [{"name": "reason", "value": RETURNS[ret_id]["reason"]}],
                "relationships": [
                    {"objectId": oid, "qualifier": "order"},
                    {"objectId": item_id, "qualifier": "item"},
                    {"objectId": ret_id, "qualifier": "return"},
                ],
            })
            events.append({
                "id": next_eid(),
                "type": "return-completed",
                "time": f"{_day(ret_day)}T14:00:00Z",
                "attributes": [{"name": "refund-amount", "value": 79.99}],
                "relationships": [
                    {"objectId": oid, "qualifier": "order"},
                    {"objectId": item_id, "qualifier": "item"},
                    {"objectId": ret_id, "qualifier": "return"},
                    {"objectId": "s8", "qualifier": "shipment"},
                ],
            })

    ocel = {
        "version": "2.0",
        "objectTypes": [
            {"name": "order", "attributes": [{"name": "order-id", "type": "string"}]},
            {"name": "item", "attributes": [{"name": "product-name", "type": "string"}]},
            {"name": "shipment", "attributes": [{"name": "tracking-number", "type": "string"}]},
            {"name": "return", "attributes": [{"name": "rma-id", "type": "string"}]},
            {"name": "invoice", "attributes": [{"name": "invoice-number", "type": "string"}]},
        ],
        "eventTypes": [
            {"name": "create-order", "attributes": [{"name": "total-items", "type": "integer"}]},
            {"name": "order-confirmation", "attributes": [{"name": "confirmation-code", "type": "string"}]},
            {"name": "order-cancelled", "attributes": [{"name": "reason", "type": "string"}]},
            {"name": "invoice-issued", "attributes": [{"name": "amount", "type": "float"}]},
            {"name": "package-prepared", "attributes": [{"name": "warehouse-id", "type": "string"}]},
            {"name": "shipment-started", "attributes": [{"name": "logistics-provider", "type": "string"}]},
            {"name": "shipment-delivered", "attributes": [{"name": "recipient", "type": "string"}]},
            {"name": "return-initiated", "attributes": [{"name": "reason", "type": "string"}]},
            {"name": "return-completed", "attributes": [{"name": "refund-amount", "type": "float"}]},
        ],
        "objects": objects,
        "events": events,
    }
    return ocel


def main():
    ocel = build()
    counts = {}
    for obj in ocel["objects"]:
        counts[obj["type"]] = counts.get(obj["type"], 0) + 1
    assert counts.get("order") == 12
    assert counts.get("item") == 30
    assert counts.get("shipment") == 8
    assert counts.get("return") == 3
    assert counts.get("invoice") == 17

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(ocel, f, ensure_ascii=False, indent=2)

    print(f"Wrote {OUT}")
    print("Counts:", counts)
    print("Events:", len(ocel["events"]))


if __name__ == "__main__":
    main()
