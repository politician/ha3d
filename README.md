# HA3D — AI-assisted 3D floor plans for Home Assistant

HA3D is a HACS-installable Home Assistant custom integration that serves a Three.js custom card for 3D floor plans with clickable Home Assistant entities.

Conceptual inspiration: `shmuelzon/home-assistant-floor-plan` and `Kdcius/3Dash_webapp` (no code copied; this project uses AI photo-to-plan JSON instead of Sweet Home 3D).

## Features

- **Three.js renderer** for performant, lightweight 3D floor-plan visualization
- **Clickable entities** mapped to Home Assistant states/services
- **Toolbar layer controls**: Lights, Climate, Covers
- **Mode switch**: Visualize (open entity info) vs Control (call services)
- **AI-ready workflow** to generate/refine plan JSON from photos using Claude, Copilot, or ChatGPT
- Built-in **plan validation service**: `ha3d.validate_plan`

## HACS installation (recommended)

1. In Home Assistant, open **HACS → Integrations → Custom repositories**.
2. Add `https://github.com/politician/ha3d` as category **Integration**.
3. Install **HA3D**.
4. Restart Home Assistant.

## Home Assistant setup

### 1) Add the integration

Go to **Settings → Devices & Services → Add Integration → HA3D**.

### 2) Add dashboard resource

Add a Lovelace resource:

- URL: `/ha3d/ha3d-card.js`
- Type: `JavaScript Module`

### 3) Add the card

```yaml
type: custom:ha3d-card
plan_url: /local/community/ha3d/examples/sample_plan.json
```

Or inline:

```yaml
type: custom:ha3d-card
plan:
  version: "1.0"
  rooms: []
  walls: []
  openings: []
  camera:
    position: [8, 7, 8]
    target: [0, 0, 0]
  entities: []
```

## AI workflow (Claude/Copilot/ChatGPT)

1. Gather room photos + rough dimensions + Home Assistant entity IDs.
2. Install the HA3D skill profile for your LLM:
   - ChatGPT: `/tmp/workspace/politician/ha3d/docs/skills/chatgpt.md`
   - Claude: `/tmp/workspace/politician/ha3d/docs/skills/claude.md`
   - Copilot: `/tmp/workspace/politician/ha3d/docs/skills/copilot.md`
3. Use `/tmp/workspace/politician/ha3d/docs/ai_skill_prompt.md` as the base instructions.
4. Save generated JSON and validate it using service `ha3d.validate_plan`.
5. Host JSON in `/config/www/...` and reference it with `plan_url`.

### Skill installation quick start

You want a remote install flow with no filesystem tinkering, so use the helper command:

```bash
curl -fsSL https://raw.githubusercontent.com/politician/ha3d/main/scripts/install-skill.sh | bash -s -- chatgpt
```

Replace `chatgpt` with `claude` or `copilot`.

What it does:

- fetches the canonical HA3D skill from GitHub
- copies it to your clipboard when possible
- opens the target UI when possible
- avoids creating local prompt files

If you want the raw prompt only:

```bash
curl -fsSL https://raw.githubusercontent.com/politician/ha3d/main/docs/skills/ha3d-skill.txt
```

Platform-specific details:

1. Pick your assistant (ChatGPT, Claude, or Copilot) and open the matching guide in `/tmp/workspace/politician/ha3d/docs/skills/`.
2. Run the one-command installer for that platform.
3. Paste into that assistant's instruction/profile area if the platform still requires a final save click.
4. Upload photos + dimensions + entity IDs.
5. Ask for HA3D JSON output only, then validate via `ha3d.validate_plan`.

### Schema summary

See full schema: `/custom_components/ha3d/plan_schema.json`

Required root fields:

- `version` (`"1.0"`)
- `rooms[]` with `id`, `name`, `polygon`
- `walls[]` with `id`, `from`, `to`, `height`
- `openings[]` with `kind` door/window
- `camera.position` and `camera.target`
- `entities[]` with `entity_id`, `layer` (`lights|climate|covers`), `position`

## Entity interactions

- **Visualize mode**: clicking marker opens more-info panel
- **Control mode**: clicking marker calls service:
  - `light.*` → `light.toggle`
  - `climate.*` → `climate.set_hvac_mode` (`off`)
  - `cover.*` → `cover.toggle`
- Override defaults per marker using `entity.control`.

## Performance guidance

- Keep room polygons minimal (avoid excessive points)
- Limit marker count to visible/interactive entities
- Use one plan per dashboard view and avoid oversized textures

## Testing

```bash
npm install
npm test
```

## Troubleshooting

- **Card not found**: ensure resource `/ha3d/ha3d-card.js` exists and HA restarted.
- **Blank scene**: validate plan fields with `ha3d.validate_plan`.
- **No click actions**: verify entity IDs exist and current mode is **Control**.
