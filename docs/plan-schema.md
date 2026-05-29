# HA3D plan schema

HA3D renders a compact JSON scene instead of hundreds of pre-rendered images. Keep dimensions in a single unit (`m` or `ft`) and place Home Assistant entities by `x`/`z` coordinates on the floor.

```json
{
  "version": 1,
  "unit": "m",
  "name": "Ground floor",
  "rooms": [
    { "id": "living", "name": "Living room", "x": 0, "z": 0, "width": 5.2, "depth": 4.2, "color": "#d7c7ad" }
  ],
  "entities": [
    { "entity": "light.living_room", "name": "Living lamp", "position": { "x": 2.6, "z": 2.1 } }
  ]
}
```

## Fields

| Field | Required | Notes |
| --- | --- | --- |
| `version` | Yes | Must be `1`. |
| `unit` | No | `m` or `ft`; defaults to `m`. |
| `rooms[]` | Yes | Rectangular room blocks. `x` and `z` are the lower-left room corner. |
| `rooms[].height` | No | Wall height; defaults to `2.7`. |
| `entities[]` | Yes | Clickable Home Assistant entity markers. |
| `entities[].layer` | No | `lights`, `climate`, or `covers`; inferred from entity domain when omitted. |
| `entities[].service` | No | Optional service override such as `light.toggle`. |
| `entities[].service_data` | No | Extra service payload merged with `entity_id`. |

## AI generation guidance

Ask your assistant to return only valid JSON, then save the result to `/config/www/ha3d/your-plan.json`. For best results, provide:

1. 6–12 photos from room corners and hallways.
2. One approximate measurement per room or a known reference object.
3. A Home Assistant entity list grouped by room.
4. Any doors/windows you want represented as gaps or low walls in a future version.
