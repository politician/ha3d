# Install HA3D skill in Claude

Use a reusable Claude Project so the prompt is always available.

## One-command install

```bash
curl -fsSL https://raw.githubusercontent.com/politician/ha3d/main/scripts/install-skill.sh | bash -s -- claude
```

This copies the HA3D skill to your clipboard and opens Claude when your OS supports opening URLs.

## Finish setup

1. Create a Claude **Project** called `HA3D`.
2. Paste the copied skill into **Project instructions**.
3. Keep the schema URL nearby for reference:

`https://raw.githubusercontent.com/politician/ha3d/main/custom_components/ha3d/plan_schema.json`

4. Save the project.

## Raw prompt only

```bash
curl -fsSL https://raw.githubusercontent.com/politician/ha3d/main/docs/skills/ha3d-skill.txt
```

## How to use

In the HA3D project chat, upload photos and send:

`Generate HA3D v1.0 JSON only from these photos, dimensions, and entity IDs.`
