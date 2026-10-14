#!/bin/bash
# hand_back.sh BRANCH RUN STATUS DIR: pushes the files in DIR as the only commit of BRANCH (each run replaces the last),
# e.g. render-out/film18 or check-out/film18. The agent fetches it with git. Needs TOKEN and REPO in the environment.
BR=$1; RUN=$2; STATUS=$3; D=$4
mkdir -p "$D"; echo '{"ignoreCommand": "exit 0"}' > "$D/vercel.json"
[ -f "$D/status.txt" ] || echo "$STATUS run $RUN" > "$D/status.txt"
cd "$D" && rm -rf .git && git init -q -b out && git add -A && git -c user.name=render -c user.email=render@users.noreply.github.com commit -qm "$BR r$RUN: $STATUS"
git push -q "https://x-access-token:${TOKEN}@github.com/${REPO}.git" HEAD:refs/heads/$BR --force
echo "handed back on $BR"
