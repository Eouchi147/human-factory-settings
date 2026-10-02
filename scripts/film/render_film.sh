#!/bin/sh
# render_film.sh <film> <outdir> <t1> <port0> [retime json]: full-quality render in two halves (resumable: existing frames are kept)
cd "$(dirname "$0")"
F=$1; O=$2; T1=$3; P=${4:-8831}; RT=${5:-}
mkdir -p "$O"
for k in 0 1; do
  if ! ps -eo cmd | grep -q "[f]ilm_render.py $O .*--start $k "; then
    if [ -n "$RT" ]; then X="--retime $RT"; else X=""; fi
    nohup python3 film_render.py "$O" --film "$F" --w 1080 --h 1920 --fps 24 --t0 0 --t1 "$T1" --blur --shadow 2048 --port $((P + k)) --start $k --step 2 $X >> "$O/log$k.txt" 2>&1 &
  fi
done
sleep 1; ps -eo pid,cmd | grep "[f]ilm_render.py $O" | cut -c1-140
