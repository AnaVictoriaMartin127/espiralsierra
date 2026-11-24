#!/usr/bin/env bash
# Render a 1080x1350 video with sound at 180 ms per step.
# Usage: ./make-video.sh [sound] [seconds] [gain]
#   sound: softbell | saw | square | pluck | marimba | glass | fm | sine   (default softbell)
set -euo pipefail
SOUND="${1:-softbell}"; SECS="${2:-30}"; GAIN="${3:-1.0}"
HERE="$(cd "$(dirname "$0")" && pwd)"
FRAMES="$HERE/frames-$SOUND"
mkdir -p "$FRAMES"
node "$HERE/render.js" "$HERE/index.html" "$FRAMES" "$SECS" "$SOUND" "$GAIN"
ffmpeg -v error -y -framerate 30 -i "$FRAMES/f%05d.png" -i "$FRAMES/audio.wav" \
  -c:v libx264 -pix_fmt yuv420p -crf 18 -af volume=3dB -c:a aac -b:a 192k \
  -shortest -movflags +faststart "$HERE/saw-spiral-180ms-$SOUND.mp4"
echo "Done: $HERE/saw-spiral-180ms-$SOUND.mp4  (you can delete $FRAMES)"
