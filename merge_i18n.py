import json

def merge(src_path, dst_path):
    with open(src_path, 'r', encoding='utf-8') as f:
        src = json.load(f)
    with open(dst_path, 'r', encoding='utf-8') as f:
        dst = json.load(f)
    
    for k, v in src.items():
        if k not in dst:
            dst[k] = v
            
    with open(dst_path, 'w', encoding='utf-8') as f:
        json.dump(dst, f, indent=2, ensure_ascii=False)

merge('/Users/shawket/Downloads/sufrix-portfolio/src/locales/en.json', 'src/shared/i18n/locales/en.json')
merge('/Users/shawket/Downloads/sufrix-portfolio/src/locales/ar.json', 'src/shared/i18n/locales/ar.json')
