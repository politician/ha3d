# Install HA3D skill in ChatGPT

This is the easiest way to make ChatGPT generate HA3D plan JSON from photos.

## One-command install

```bash
curl -fsSL https://raw.githubusercontent.com/politician/ha3d/main/scripts/install-skill.sh | bash -s -- chatgpt
```

This copies the HA3D skill to your clipboard and opens the ChatGPT GPT editor when your OS supports opening URLs.

## Finish setup

1. In ChatGPT, go to **Explore GPTs** → **Create**.
2. In **Configure**:
   - Name: `HA3D Plan Builder`
   - Description: `Generates HA3D v1.0 floor plan JSON from photos and notes.`
3. Paste the copied skill into **Instructions**.
4. (Optional) Enable image input.
5. Save the GPT.

## Raw prompt only

```bash
curl -fsSL https://raw.githubusercontent.com/politician/ha3d/main/docs/skills/ha3d-skill.txt
```

## How to use

Provide:
- photos of each room,
- rough dimensions,
- Home Assistant entity IDs.

Ask: `Generate HA3D JSON v1.0 for this home. Return JSON only.`
