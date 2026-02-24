#!/bin/bash
# Called by Claude Code hooks inside containers.
# Reads hook JSON from stdin, POSTs event to the claude-manager server.
# CLAUDE_MANAGER_URL must be set (e.g. http://10.0.0.1:3000)

INPUT=$(cat)
HOST=$(hostname)
EVENT=$(echo "$INPUT" | jq -r '.hook_event_name // empty')

if [ -z "$CLAUDE_MANAGER_URL" ] || [ -z "$EVENT" ]; then
  exit 0
fi

curl -sf -X POST "${CLAUDE_MANAGER_URL}/api/alerts" \
  -H 'Content-Type: application/json' \
  -d "{\"hostname\":\"$HOST\",\"event\":\"$EVENT\"}" \
  >/dev/null 2>&1 &

exit 0
