import json

def update_json(filepath, updates):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if "landing" not in data:
        data["landing"] = {}
    if "trustedBy" not in data["landing"]:
        data["landing"]["trustedBy"] = {}
        
    for k, v in updates.items():
        data["landing"]["trustedBy"][k] = v
        
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

en_updates = {
    "since": "Since",
    "branch": "Branch",
    "branches": "Branches"
}

ar_updates = {
    "since": "منذ",
    "branch": "فرع",
    "branches": "فروع"
}

update_json("src/shared/i18n/locales/en.json", en_updates)
update_json("src/shared/i18n/locales/ar.json", ar_updates)
print("Updated TrustedBy translations successfully.")
