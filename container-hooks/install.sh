#!/bin/bash
# Install Claude Manager hooks into a container.
# Run this once on your template container — all clones inherit it.
#
# Usage: ./install.sh <container-ip> <manager-url>
# Example: ./install.sh 10.0.0.50 http://10.0.0.1:3000

set -e

IP="$1"
MANAGER_URL="$2"

if [ -z "$IP" ] || [ -z "$MANAGER_URL" ]; then
  echo "Usage: $0 <container-ip> <manager-url>"
  echo "Example: $0 10.0.0.50 http://10.0.0.1:3000"
  exit 1
fi

SSH="ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i /root/.ssh/id_rsa root@${IP}"

echo "[1/3] Installing notify script..."
$SSH "mkdir -p /opt/claude-manager"
scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i /root/.ssh/id_rsa \
  "$(dirname "$0")/notify.sh" "root@${IP}:/opt/claude-manager/notify.sh"
$SSH "chmod +x /opt/claude-manager/notify.sh"

echo "[2/3] Setting CLAUDE_MANAGER_URL..."
$SSH "grep -q CLAUDE_MANAGER_URL /etc/environment 2>/dev/null && \
  sed -i 's|^CLAUDE_MANAGER_URL=.*|CLAUDE_MANAGER_URL=${MANAGER_URL}|' /etc/environment || \
  echo 'CLAUDE_MANAGER_URL=${MANAGER_URL}' >> /etc/environment"

echo "[3/3] Configuring Claude Code hooks..."
$SSH bash <<'REMOTE'
mkdir -p ~/.claude

cat > ~/.claude/settings.json <<'EOF'
{
  "hooks": {
    "Notification": [
      {
        "matcher": "permission_prompt|idle_prompt|elicitation_dialog",
        "hooks": [
          { "type": "command", "command": "/opt/claude-manager/notify.sh" }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          { "type": "command", "command": "/opt/claude-manager/notify.sh" }
        ]
      }
    ],
    "SubagentStart": [
      {
        "hooks": [
          { "type": "command", "command": "/opt/claude-manager/notify.sh" }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "/opt/claude-manager/notify.sh" }
        ]
      }
    ]
  }
}
EOF
REMOTE

echo "Done. Hooks installed on ${IP}."
echo "Events tracked: UserPromptSubmit, SubagentStart, Notification, Stop"
