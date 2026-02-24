#!/bin/bash
# Called by Claude Code hooks inside containers.
# Event name is passed as $1 (e.g. "Stop", "Notification").
# URL is baked in by provision.js — this copy is a template for manual installs.
# Replace MANAGER_URL below with your server's address.

MANAGER_URL="${CLAUDE_MANAGER_URL:-http://CHANGE_ME:3000}"

curl -sf -X POST "${MANAGER_URL}/api/alerts" \
  -H 'Content-Type: application/json' \
  -d "{\"hostname\":\"$(hostname)\",\"event\":\"$1\"}" \
  >/dev/null 2>&1 &

exit 0
