"""HA3D integration entrypoint."""

from __future__ import annotations

import logging
from typing import Any

from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, ServiceCall

from .const import DOMAIN, STATIC_PATH, STATIC_URL
from .plan_schema import validate_plan

_LOGGER = logging.getLogger(__name__)


async def async_setup(hass: HomeAssistant, config: dict[str, Any]) -> bool:
    """Set up HA3D from YAML (for service/static availability)."""
    await _async_setup_common(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up HA3D from a config entry."""
    await _async_setup_common(hass)
    hass.data.setdefault(DOMAIN, {})[entry.entry_id] = True
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload HA3D config entry."""
    hass.data.get(DOMAIN, {}).pop(entry.entry_id, None)
    return True


async def _async_setup_common(hass: HomeAssistant) -> None:
    if not hass.data.get(f"{DOMAIN}_static_registered"):
        await hass.http.async_register_static_paths(
            [StaticPathConfig(STATIC_URL, str(STATIC_PATH), cache_headers=False)]
        )
        hass.data[f"{DOMAIN}_static_registered"] = True

    async def async_validate_plan(call: ServiceCall) -> None:
        plan = call.data.get("plan", {})
        errors = validate_plan(plan)
        hass.bus.async_fire(
            f"{DOMAIN}_plan_validated",
            {"valid": not errors, "errors": errors},
        )

    if not hass.services.has_service(DOMAIN, "validate_plan"):
        hass.services.async_register(DOMAIN, "validate_plan", async_validate_plan)

    _LOGGER.debug("HA3D initialized; frontend available at %s/ha3d-card.js", STATIC_URL)
