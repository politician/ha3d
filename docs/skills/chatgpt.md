# Install HA3D skill in ChatGPT

This is the easiest way to make ChatGPT generate HA3D plan JSON from photos.

## Quick install

1. Open ChatGPT and go to **Explore GPTs**.
2. Click **Create**.
3. In **Configure**:
   - Name: `HA3D Plan Builder`
   - Description: `Generates HA3D v1.0 floor plan JSON from photos and notes.`
4. Paste the full prompt from `/tmp/workspace/politician/ha3d/docs/ai_skill_prompt.md` into **Instructions**.
5. (Optional) Enable image input so you can upload room photos.
6. Save the GPT (private or workspace).

## How to use

Provide:
- photos of each room,
- rough dimensions,
- Home Assistant entity IDs.

Ask: `Generate HA3D JSON v1.0 for this home. Return JSON only.`
