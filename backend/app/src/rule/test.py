from rule import Rule
import json

with open(r"C:\Users\Hudson Chen\Desktop\Thesis\simulated_data\example_data.json", "r", encoding="utf-8") as f:
    data = json.load(f)

r = Rule("test_rule", include_object=['order', 'item'], exclude_activity=['order-confirmation'])
print(r)

for event in data['events']:
    r.check_event(event)

with open(r"C:\Users\Hudson Chen\Desktop\Thesis\simulated_data\example_data_2.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=4)