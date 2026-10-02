#!/bin/bash
# encode_film.sh FRAMES_DIR AUDIO_WAV OUT_MP4 [T0] [DUR] [SCALE]
F=$1; A=$2; O=$3; T0=${4:-0}; D=${5:-63}; S=${6:-}
VF="format=yuv420p"; [ -n "$S" ] && VF="scale=$S:flags=lanczos,format=yuv420p"
ffmpeg -y -loglevel error -framerate 24 -i "$F/f%05d.jpg" -ss "$T0" -t "$D" -i "$A" -map 0:v -map 1:a -c:v libx264 -preset slow -crf 17 -vf "$VF" -r 24 \
  -c:a aac -b:a 192k -af "loudnorm=I=-16:TP=-1.5:LRA=11" -shortest -movflags +faststart "$O"
