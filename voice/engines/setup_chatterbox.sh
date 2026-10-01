set -euo pipefail
sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg > /dev/null
python -m pip install -q --upgrade pip
pip install -q torch==2.6.0 torchaudio==2.6.0 --index-url https://download.pytorch.org/whl/cpu
pip install -q chatterbox-tts
pip install -q faster-whisper jiwer
python -c "import librosa" 2>/dev/null || pip install -q librosa
pip list 2>/dev/null | grep -i -E "^(chatterbox-tts|torch|faster-whisper|ctranslate2|librosa) "
