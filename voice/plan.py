"""Turn voice/job.json into the workflow's matrix."""
import json, os
with open(os.path.join(os.path.dirname(__file__), "job.json")) as f:
    job = json.load(f)
print("matrix=" + json.dumps({"include": job["jobs"]}))
print("run=" + job["run"])
print("scan=" + ("true" if job.get("scan") else "false"))
