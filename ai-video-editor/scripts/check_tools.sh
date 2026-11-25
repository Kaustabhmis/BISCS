#!/usr/bin/env bash
# Report which editing tools are installed. Changes nothing.
for t in ffmpeg ffprobe whisper yt-dlp python3 node claude; do
  if command -v "$t" >/dev/null 2>&1; then
    case "$t" in
      ffmpeg|ffprobe) v=$("$t" -version 2>/dev/null | head -1) ;;
      whisper)        v="openai-whisper $(python3 -c 'import importlib.metadata as m;print(m.version("openai-whisper"))' 2>/dev/null)" ;;
      *)              v=$("$t" --version 2>/dev/null | head -1) ;;
    esac
    printf 'OK       %-8s %s\n' "$t" "$v"
  else
    printf 'MISSING  %s\n' "$t"
  fi
done
if command -v ffmpeg >/dev/null 2>&1; then
  enc=$(ffmpeg -hide_banner -encoders 2>/dev/null)
  flt=$(ffmpeg -hide_banner -filters 2>/dev/null)
  grep -q libx264 <<<"$enc" && echo "OK       H.264 encoder (libx264)" || echo "MISSING  H.264 encoder (libx264)"
  grep -q ' aac '  <<<"$enc" && echo "OK       AAC encoder"            || echo "MISSING  AAC encoder"
  grep -q ' subtitles ' <<<"$flt" && echo "OK       caption burn-in (libass)" || echo "MISSING  caption burn-in (libass)"
fi
