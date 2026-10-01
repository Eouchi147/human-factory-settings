set -euo pipefail
sudo apt-get update -qq && sudo apt-get install -y -qq espeak-ng ffmpeg > /dev/null
python -m pip install -q --upgrade pip
pip install -q torch torchaudio --index-url https://download.pytorch.org/whl/cpu
pip install -q "kokoro>=0.9.4" soundfile
pip install -q faster-whisper jiwer librosa
python -m spacy download en_core_web_sm -q || true
pip list 2>/dev/null | grep -i -E "^(kokoro|misaki|torch|faster-whisper|ctranslate2) "
