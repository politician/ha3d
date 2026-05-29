import { describe, expect, it } from "vitest";

import { getDefaultControlAction, getEntityVisibility, validatePlanData } from "../custom_components/ha3d/www/plan-utils.js";

const validPlan = {
  version: "1.0",
  rooms: [{ id: "living", name: "Living", polygon: [[0, 0], [4, 0], [4, 3]] }],
  walls: [{ id: "w1", from: [0, 0], to: [4, 0], height: 2.6 }],
  openings: [],
  camera: { position: [6, 5, 6], target: [2, 0, 1.5] },
  entities: [{ id: "e1", entity_id: "light.living", layer: "lights", position: [1, 0.2, 1] }],
};

describe("validatePlanData", () => {
  it("accepts a valid plan", () => {
    expect(validatePlanData(validPlan)).toEqual([]);
  });

  it("reports missing required structure", () => {
    expect(validatePlanData({ version: "1.0" })).toContain("missing 'rooms'");
  });

  it("rejects entities with unsupported layer", () => {
    const plan = {
      ...validPlan,
      entities: [{ id: "e2", entity_id: "switch.x", layer: "switches", position: [1, 0.2, 1] }],
    };
    expect(validatePlanData(plan).join("\n")).toMatch(/layer must be one of/);
  });
});

describe("entity interaction helpers", () => {
  it("returns visibility by layer", () => {
    expect(getEntityVisibility({ layer: "lights" }, { lights: true })).toBe(true);
    expect(getEntityVisibility({ layer: "lights" }, { lights: false })).toBe(false);
  });

  it("creates sensible default actions", () => {
    expect(getDefaultControlAction("light.demo")).toEqual({ domain: "light", service: "toggle" });
    expect(getDefaultControlAction("climate.demo")).toEqual({
      domain: "climate",
      service: "set_hvac_mode",
      data: { hvac_mode: "off" },
    });
  });
});
