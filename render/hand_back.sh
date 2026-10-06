#!/bin/bash
# hand a film back: the two cuts, the master (in parts under GitHub's 100 MB file limit) and the logs, on a branch of
# their own, render-out/<film>-r<run> (Claude fetches it with git, then deletes it)
FILM=$1; RUN=$2; STATUS=$3
cd "$(dirname "$0")/.."
D=/tmp/handback; rm -rf $D; mkdir -p $D
cp scripts/out/*.mp4 $D/ 2>/dev/null
for f in scripts/out/hq/*.mp4; do [ -f "$f" ] && split -b 90m -d "$f" "$D/$(basename "$f").part"; done
cp scripts/film/*.log $D/ 2>/dev/null; ls -la scripts/film/frames* 2>/dev/null | head -3 > $D/frames.txt
echo "$STATUS" > $D/status.txt; echo '{"ignoreCommand": "exit 0"}' > $D/vercel.json
cd $D && git init -q -b out && git add -A && git -c user.name=render -c user.email=render@users.noreply.github.com commit -qm "$FILM r$RUN: $STATUS"
git push -q "https://x-access-token:${TOKEN}@github.com/${REPO}.git" HEAD:refs/heads/render-out/$FILM-r$RUN --force
