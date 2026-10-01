"""What open text-to-speech models exist today, how popular, and under which licence (Hugging Face API data)."""
import json, sys, time, urllib.request

API = "https://huggingface.co/api/models"


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "hfs-voice-lab"}), timeout=60) as r:
        return json.load(r)


def lic(m):
    for t in m.get("tags", []):
        if t.startswith("license:"):
            return t.split(":", 1)[1]
    return (m.get("cardData") or {}).get("license")


seen = {}
for tag in ("text-to-speech", "text-to-audio"):
    for sort in ("trendingScore", "likes", "downloads", "createdAt"):
        url = f"{API}?pipeline_tag={tag}&sort={sort}&direction=-1&limit=100&full=true&cardData=true"
        try:
            for m in get(url):
                seen.setdefault(m["id"], m)
        except Exception as e:  # noqa: BLE001
            print("scan failed", tag, sort, e, file=sys.stderr)
        time.sleep(0.5)

rows = []
for mid, m in seen.items():
    card = m.get("cardData") or {}
    rows.append({"id": mid, "likes": m.get("likes", 0), "downloads_30d": m.get("downloads", 0),
                 "trending": m.get("trendingScore"), "created": (m.get("createdAt") or "")[:10],
                 "modified": (m.get("lastModified") or "")[:10], "license": lic(m),
                 "license_name": card.get("license_name"), "license_link": card.get("license_link"),
                 "languages": card.get("language"), "pipeline": m.get("pipeline_tag"), "library": m.get("library_name"),
                 "gated": m.get("gated")})
rows.sort(key=lambda r: -(r["likes"] or 0))
json.dump({"generated": time.strftime("%Y-%m-%d %H:%M UTC", time.gmtime()), "models": rows}, sys.stdout, indent=1)
