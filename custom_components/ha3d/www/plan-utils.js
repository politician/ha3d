export const SUPPORTED_LAYERS = ["lights", "climate", "covers"];

export function validatePlanData(plan) {
  const errors = [];
  if (!plan || typeof plan !== "object") {
    return ["plan must be an object"];
  }

  const required = ["version", "rooms", "walls", "openings", "camera", "entities"];
  for (const key of required) {
    if (!(key in plan)) {
      errors.push(`missing '${key}'`);
    }
  }

  if (!Array.isArray(plan.entities)) {
    errors.push("entities must be an array");
  } else {
    plan.entities.forEach((entity, index) => {
      if (!entity?.entity_id) {
        errors.push(`entities[${index}].entity_id is required`);
      }
      if (!SUPPORTED_LAYERS.includes(entity?.layer)) {
        errors.push(`entities[${index}].layer must be one of ${SUPPORTED_LAYERS.join(", ")}`);
      }
      if (!Array.isArray(entity?.position) || entity.position.length !== 3) {
        errors.push(`entities[${index}].position must be [x,y,z]`);
      }
    });
  }

  if (!Array.isArray(plan.rooms)) {
    errors.push("rooms must be an array");
  }
  if (!Array.isArray(plan.walls)) {
    errors.push("walls must be an array");
  }

  const cameraPosition = plan.camera?.position;
  const cameraTarget = plan.camera?.target;
  if (!Array.isArray(cameraPosition) || cameraPosition.length !== 3 || !Array.isArray(cameraTarget) || cameraTarget.length !== 3) {
    errors.push("camera must include position[3] and target[3]");
  }

  return errors;
}

export function getEntityVisibility(entity, layerVisibility) {
  return Boolean(layerVisibility[entity.layer]);
}

export function getDefaultControlAction(entityId) {
  const [domain] = String(entityId).split(".");
  if (domain === "light") return { domain: "light", service: "toggle" };
  if (domain === "climate") return { domain: "climate", service: "set_hvac_mode", data: { hvac_mode: "off" } };
  if (domain === "cover") return { domain: "cover", service: "toggle" };
  return null;
}
