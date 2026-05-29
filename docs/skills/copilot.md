# Install HA3D skill in GitHub Copilot

Set up a reusable prompt or custom instructions entry in Copilot Chat so generation is consistent.

## One-command install

```bash
curl -fsSL https://raw.githubusercontent.com/politician/ha3d/main/scripts/install-skill.sh | bash -s -- copilot
```

This copies the HA3D skill to your clipboard without requiring any local file edits.

## Finish setup

1. Open Copilot Chat.
2. Paste the copied skill into your Copilot Custom Instructions UI or prompt library UI.
3. Start a new chat with photos/descriptions, dimensions, and entity IDs.

> Copilot does not currently expose a standard public remote-import API for custom prompts/instructions, so the install helper focuses on clipboard-based setup with no filesystem tinkering.

## Raw prompt only

```bash
curl -fsSL https://raw.githubusercontent.com/politician/ha3d/main/docs/skills/ha3d-skill.txt
```

## Suggested Copilot request

`Generate valid HA3D v1.0 plan JSON from this photo set. Return JSON only.`
