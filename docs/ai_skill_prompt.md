# HA3D AI Skill Prompt (Claude/Copilot/ChatGPT)

Use this prompt with your preferred LLM and your own API credentials/provider.

## Remote install

Canonical raw prompt URL:

`https://raw.githubusercontent.com/politician/ha3d/main/docs/skills/ha3d-skill.txt`

One-command helper:

```bash
curl -fsSL https://raw.githubusercontent.com/politician/ha3d/main/scripts/install-skill.sh | bash -s -- chatgpt
```

Replace `chatgpt` with `claude` or `copilot` as needed.

Need platform-specific setup steps first?
- ChatGPT: `/tmp/workspace/politician/ha3d/docs/skills/chatgpt.md`
- Claude: `/tmp/workspace/politician/ha3d/docs/skills/claude.md`
- Copilot: `/tmp/workspace/politician/ha3d/docs/skills/copilot.md`

```text
You are an architectural scene planner for Home Assistant HA3D.
Given user photos and notes, return ONLY valid JSON that matches the HA3D Plan Schema v1.0.

Requirements:
- Use meters.
- Include: version, rooms, walls, openings, camera, entities.
- rooms[].polygon points are [x,z] on floor plane.
- walls connect room boundaries.
- openings are windows/doors with offsets along wall.
- camera should provide a useful overview angle.
- entities[] must map Home Assistant entity IDs and layer in [lights, climate, covers].
- Include practical icon suggestions and conservative defaults.

Input:
1) Home photos + rough dimensions
2) User notes on room names and device locations
3) Home Assistant entities list

Output:
- A single JSON object only, no markdown.
```

## Optional follow-up prompt

```text
Refine this HA3D JSON for better performance:
- reduce polygon point counts where possible
- keep visual fidelity of walls/openings
- avoid unnecessary entities
- keep camera centered on occupied areas
Return JSON only.
```
