# HA3D plan schema

The card accepts simple JSON/YAML data so AI tools can generate plans without Sweet Home 3D.

| Field | Required | Description |
| --- | --- | --- |
| `plan.units` | No | `m`, `cm`, or `ft`; meters are recommended. |
| `plan.floors[]` | Yes | Floor geometry. Use one card per floor for very large houses. |
| `floor.outline[]` | Yes | Polygon points `{x, y}` used for the base slab. |
| `floor.rooms[]` | No | Named room polygons with optional material keys. |
| `floor.walls[]` | No | Wall segments from `{x, y}` to `{x, y}` with height/thickness. |
| `plan.entities[]` | Yes | Clickable Home Assistant markers. |
| `entity.layer` | Yes | One of `lights`, `climate`, or `covers`. |
| `entity.position` | Yes | `[x, height, y]` in Three.js coordinates. |
| `entity.action` | No | `toggle`, `more-info`, or `none`; defaults to `toggle`. |

Performance tips:

- Keep geometry low-poly and readable. Most real homes look great with straight wall boxes and simple room polygons.
- Cap `performance.pixel_ratio_cap` to `1.5` on wall tablets and dashboards.
- Split multi-floor or very large homes into separate cards/tabs.
- Use labels and icons instead of importing heavy 3D furniture models.
