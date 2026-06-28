import json
import os

def update_json(filepath, updates):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if "landing" not in data:
        data["landing"] = {}
    if "cta" not in data["landing"]:
        data["landing"]["cta"] = {}
        
    for k, v in updates.items():
        data["landing"]["cta"][k] = v
        
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

en_updates = {
    "title": "Ready to upgrade your operations?",
    "subtitle": "Madar is built to flex with your business. Contact our creator today to get started.",
    "creator": "Creator",
    "email": "Email",
    "dropEmail": "Drop an email"
}

ar_updates = {
    "title": "هل أنت مستعد لترقية عملياتك؟",
    "subtitle": "تم تصميم Madar ليتناسب مع أعمالك. تواصل مع المطور اليوم للبدء.",
    "creator": "المطور",
    "email": "البريد الإلكتروني",
    "dropEmail": "أرسل بريداً إلكترونياً"
}

update_json("src/shared/i18n/locales/en.json", en_updates)
update_json("src/shared/i18n/locales/ar.json", ar_updates)
print("Updated CTA translations successfully.")
