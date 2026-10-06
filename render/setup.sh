#!/bin/bash
# set up a GitHub runner to render (and with "assemble", to make the cuts): the browser, the 3D models, three.js, fonts
set -e
cd "$(dirname "$0")/.."
sudo apt-get update -qq
sudo apt-get install -y -qq libegl1 libgl1-mesa-dri libgles2 > /dev/null
if [ "$1" = assemble ]; then sudo apt-get install -y -qq ffmpeg > /dev/null; fi
pip install -q playwright==1.56.0 numpy scipy pillow soundfile
python -m playwright install --with-deps chromium > /dev/null
mkdir -p /tmp/nm && (cd /tmp/nm && npm init -y > /dev/null && npm i --silent three@0.170.0 @fontsource-variable/archivo@5.3.0 @fontsource/geist-mono@5.3.0 @fontsource/instrument-serif@5.3.0)
ln -sfn /tmp/nm/node_modules scripts/film/node_modules
ln -sfn /tmp/nm/node_modules scripts/film/fontmods
mkdir -p scripts/film/models && cp render/models/atlas.json scripts/film/models/
for f in render/models/*.bin.gz; do gunzip -c "$f" > "scripts/film/models/$(basename "$f" .gz)"; done
mkdir -p scripts/voice && ln -sfn "$PWD/render/voice" scripts/voice/guides
echo "ready: $(nproc) cores, $(free -g | awk '/Mem/{print $2}') GB"
