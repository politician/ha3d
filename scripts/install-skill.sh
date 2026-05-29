#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-}"
FLAG="${2:-}"
PROMPT_URL="${HA3D_PROMPT_URL:-https://raw.githubusercontent.com/politician/ha3d/main/docs/skills/ha3d-skill.txt}"
SCHEMA_URL="${HA3D_SCHEMA_URL:-https://raw.githubusercontent.com/politician/ha3d/main/custom_components/ha3d/plan_schema.json}"

usage() {
  cat <<USAGE
Usage:
  curl -fsSL https://raw.githubusercontent.com/politician/ha3d/main/scripts/install-skill.sh | bash -s -- <chatgpt|claude|copilot>

Options:
  --print    Print the raw HA3D skill prompt instead of copying/opening
USAGE
}

if [[ -z "$TARGET" ]]; then
  usage
  exit 1
fi

case "$TARGET" in
  chatgpt)
    DEST_URL="https://chatgpt.com/gpts/editor"
    NEXT_STEP="Paste into the GPT Instructions field and save the GPT."
    ;;
  claude)
    DEST_URL="https://claude.ai"
    NEXT_STEP="Paste into Claude Project instructions and keep the schema URL handy."
    ;;
  copilot)
    DEST_URL=""
    NEXT_STEP="Paste into Copilot Custom Instructions or a reusable prompt entry in the UI."
    ;;
  *)
    usage
    exit 1
    ;;
esac

if [[ "$FLAG" == "--print" ]]; then
  curl -fsSL "$PROMPT_URL"
  exit 0
fi

open_url() {
  local url="$1"
  [[ -z "$url" ]] && return 0
  if command -v open >/dev/null 2>&1; then
    open "$url" >/dev/null 2>&1 || true
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$url" >/dev/null 2>&1 || true
  elif command -v powershell.exe >/dev/null 2>&1; then
    powershell.exe -NoProfile -Command "Start-Process '$url'" >/dev/null 2>&1 || true
  fi
}

copy_clipboard() {
  if command -v pbcopy >/dev/null 2>&1; then
    pbcopy
  elif command -v wl-copy >/dev/null 2>&1; then
    wl-copy
  elif command -v xclip >/dev/null 2>&1; then
    xclip -selection clipboard
  elif command -v xsel >/dev/null 2>&1; then
    xsel --clipboard --input
  elif command -v clip.exe >/dev/null 2>&1; then
    clip.exe
  elif command -v powershell.exe >/dev/null 2>&1; then
    powershell.exe -NoProfile -Command '$input | Set-Clipboard'
  else
    return 1
  fi
}

PROMPT_CONTENT="$(curl -fsSL "$PROMPT_URL")"

if printf '%s' "$PROMPT_CONTENT" | copy_clipboard; then
  CLIPBOARD_STATUS="copied to your clipboard"
else
  CLIPBOARD_STATUS="printed below because no clipboard command was found"
fi

open_url "$DEST_URL"

cat <<EOF2
HA3D skill ${CLIPBOARD_STATUS}.

Prompt URL:
  ${PROMPT_URL}
Schema URL:
  ${SCHEMA_URL}
Next step:
  ${NEXT_STEP}
EOF2

if [[ "$CLIPBOARD_STATUS" == printed* ]]; then
  printf '\n----- BEGIN HA3D SKILL -----\n%s\n----- END HA3D SKILL -----\n' "$PROMPT_CONTENT"
fi
