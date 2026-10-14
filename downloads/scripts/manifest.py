#!/usr/bin/env python3
"""Same as manifest.mjs, for the box (no Node there): python3 manifest.py [root].
Installed as /usr/local/bin/madar-downloads-rebuild. Keep the two equal
(manifest.test.mjs runs both on one tree and compares)."""
import hashlib, json, os, re, sys, time

TAG_PREFIX = {"dawam": "staff-v", "dashboard": "dash-v", "kitchen": "kitchen-v"}
SHA = re.compile(r"^[0-9a-f]{64}$")


def iso(t):
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(int(t)))


def vkey(v):
    core, _, pre = v.partition("-")
    return ([int(re.match(r"\d*", x).group() or 0) for x in core.split(".")], pre)


def newer(a):  # sort key, newest first handled by reverse
    nums, pre = vkey(a)
    return (nums + [0] * (8 - len(nums)), 0 if pre else 1, pre)


def sha256(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def dirs(d):
    return sorted(e for e in os.listdir(d) if os.path.isdir(os.path.join(d, e)) and not e.startswith("."))


def build(root):
    files = os.path.join(root, "files")
    products = {}
    for product in dirs(files) if os.path.isdir(files) else []:
        releases = []
        for version in dirs(os.path.join(files, product)):
            if version == "latest":
                continue
            d = os.path.join(files, product, version)
            tag = TAG_PREFIX.get(product, "v") + version
            lst = []
            for name in sorted(os.listdir(d)):
                if name.startswith(".") or name.endswith((".sha256", ".partial")):
                    continue
                p = os.path.join(d, name)
                if not os.path.isfile(p):
                    continue
                side = ""
                if os.path.exists(p + ".sha256"):
                    parts = open(p + ".sha256").read().split()
                    side = parts[0].lower() if parts else ""
                lst.append({"name": name, "size": os.path.getsize(p), "sha256": side if SHA.match(side) else sha256(p),
                            "url": f"/files/{product}/{version}/{name}", "date": iso(os.path.getmtime(p)), "tag": tag})
            if lst:
                releases.append({"version": version, "tag": tag, "date": max(x["date"] for x in lst), "files": lst})
        releases.sort(key=lambda r: newer(r["version"]), reverse=True)
        if releases:
            products[product] = {"releases": releases}
    return {"generated": iso(time.time()), "products": products}


def link_latest(root, m):
    for product, pr in m["products"].items():
        rel = next((r for r in pr["releases"] if "-" not in r["version"]), pr["releases"][0])
        d = os.path.join(root, "files", product, "latest")
        os.makedirs(d, exist_ok=True)
        want = {}
        for f in rel["files"]:
            if rel["version"] not in f["name"]:
                continue
            link = f["name"].replace(rel["version"], "latest", 1)
            want[link] = f"../{rel['version']}/{f['name']}"
            f["latest"] = f"/files/{product}/latest/{link}"
        for link, target in want.items():
            p = os.path.join(d, link)
            if os.path.islink(p) and os.readlink(p) == target:
                continue
            if os.path.lexists(p + ".tmp"):
                os.unlink(p + ".tmp")
            os.symlink(target, p + ".tmp")
            os.replace(p + ".tmp", p)
        for n in os.listdir(d):
            if n not in want and os.path.islink(os.path.join(d, n)):
                os.unlink(os.path.join(d, n))


if __name__ == "__main__":
    root = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else "/var/www/madar-downloads")
    m = build(root)
    link_latest(root, m)
    out = os.path.join(root, "files", "manifest.json")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out + ".tmp", "w") as f:
        json.dump(m, f, indent=2, ensure_ascii=False)
        f.write("\n")
    os.replace(out + ".tmp", out)
    n = sum(len(r["files"]) for p in m["products"].values() for r in p["releases"])
    print(f"manifest: {len(m['products'])} products, {n} files -> {out}")
