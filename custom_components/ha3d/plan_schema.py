"""Shared plan schema validation for HA3D."""

from __future__ import annotations

from typing import Any

LAYER_SET = {"lights", "climate", "covers"}


def _is_xyz(value: Any) -> bool:
    return isinstance(value, list) and len(value) == 3 and all(isinstance(v, (int, float)) for v in value)


def validate_plan(plan: dict[str, Any]) -> list[str]:
    """Return a list of schema errors. Empty list means valid."""
    errors: list[str] = []

    if not isinstance(plan, dict):
        return ["plan must be an object"]

    for key in ("version", "rooms", "walls", "openings", "camera", "entities"):
        if key not in plan:
            errors.append(f"missing '{key}'")

    if not isinstance(plan.get("rooms"), list):
        errors.append("rooms must be an array")

    if not isinstance(plan.get("walls"), list):
        errors.append("walls must be an array")

    camera = plan.get("camera")
    if not isinstance(camera, dict) or not _is_xyz(camera.get("position")) or not _is_xyz(camera.get("target")):
        errors.append("camera must include numeric position[3] and target[3]")

    entities = plan.get("entities")
    if isinstance(entities, list):
        for idx, entity in enumerate(entities):
            if not isinstance(entity, dict):
                errors.append(f"entities[{idx}] must be an object")
                continue
            if not entity.get("entity_id"):
                errors.append(f"entities[{idx}].entity_id is required")
            if entity.get("layer") not in LAYER_SET:
                errors.append(f"entities[{idx}].layer must be one of lights, climate, covers")
            if not _is_xyz(entity.get("position")):
                errors.append(f"entities[{idx}].position must be numeric [x,y,z]")
    else:
        errors.append("entities must be an array")

    return errors
