#!/usr/bin/env bash
# Export a video as an Instagram Reel: MP4, H.264, AAC, 1080x1920, source frame rate.
# Usage: scripts/export_reel.sh <input> <output.mp4> [captions.srt|.ass]
# The input is never modified. Non-vertical footage is fitted and padded with black.
set -euo pipefail
in=${1:?usage: export_reel.sh <input> <output.mp4> [captions]}
out=${2:?usage: export_reel.sh <input> <output.mp4> [captions]}
subs=${3:-}

[ -f "$in" ] || { echo "Input not found: $in" >&2; exit 1; }
[ "$(realpath -m "$in")" != "$(realpath -m "$out")" ] || { echo "Output must differ from input" >&2; exit 1; }
mkdir -p "$(dirname "$out")"

vf="scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1"
if [ -n "$subs" ]; then
  [ -f "$subs" ] || { echo "Captions not found: $subs" >&2; exit 1; }
  esc=$(printf '%s' "$subs" | sed -e 's/\\/\\\\/g' -e "s/'/\\\\'/g" -e 's/:/\\:/g')
  vf="$vf,subtitles='$esc':force_style='Fontsize=14,Bold=1,Outline=2,Alignment=2,MarginV=110'"
fi

ffmpeg -hide_banner -loglevel error -stats -y -i "$in" -vf "$vf" \
  -c:v libx264 -preset medium -crf 20 -profile:v high -pix_fmt yuv420p \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$out"

# Verify the result instead of assuming it worked.
ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,r_frame_rate:format=duration \
  -of default=nw=1 "$out"
echo "Exported: $out"
