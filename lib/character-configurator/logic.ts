import {
  ARCHETYPE_DATA,
  ARC_LABEL,
  BASE_TYPE_DISPLAY,
  MASK_SUFFIX,
  type BaseType,
  type MaskZone,
  type WoundZone,
} from "./data";

export type SliderValues = {
  heart: number;
  soul: number;
  mask: number;
  wound: number;
  bonds?: number;
  code?: number;
};

export type GeneratedConfig = {
  base_type: BaseType;
  archetype_name: string;
  tagline: string;
  core_desire: string;
  core_fear: string;
  wound_text: string;
  gift_text: string;
  shadow_text: string;
  narrative_arc: string;
  conflicts: string[];
  hooks: string[];
  inspirations: string[];
};

// Rule Set 1 — heart × soul matrix
function getBaseType(heart: number, soul: number): BaseType {
  const heartZone = heart <= 3 ? "fear" : heart <= 6 ? "tension" : "desire";
  const soulZone = soul <= 3 ? "self" : soul <= 6 ? "balance" : "others";

  const matrix: Record<string, Record<string, BaseType>> = {
    fear: { self: "fortress", balance: "guardian", others: "victim" },
    tension: { self: "mercenary", balance: "seeker", others: "mediator" },
    desire: { self: "conqueror", balance: "visionary", others: "savior" },
  };

  return matrix[heartZone]![soulZone]!;
}

// Rule Set 2 — mask zone
function getMaskZone(mask: number): MaskZone {
  if (mask <= 3) return "shadow";
  if (mask <= 6) return "balanced";
  return "light";
}

// Rule Set 3 — wound zone
function getWoundZone(wound: number): WoundZone {
  if (wound <= 3) return "repression";
  if (wound <= 6) return "struggle";
  return "integration";
}

export function generateConfig(sliders: SliderValues): GeneratedConfig {
  const baseType = getBaseType(sliders.heart, sliders.soul);
  const maskZone = getMaskZone(sliders.mask);
  const woundZone = getWoundZone(sliders.wound);

  const data = ARCHETYPE_DATA[baseType];
  const displayName = BASE_TYPE_DISPLAY[baseType];
  const suffix = MASK_SUFFIX[maskZone];
  const archetypeName = displayName + suffix;

  const tagline =
    maskZone === "shadow"
      ? data.tagline_shadow
      : maskZone === "light"
        ? data.tagline_light
        : data.tagline;

  const shadowText =
    woundZone === "repression"
      ? data.shadow_repression
      : woundZone === "struggle"
        ? data.shadow_struggle
        : data.shadow_integration;

  const conflicts =
    woundZone === "repression"
      ? data.conflicts_repression
      : woundZone === "struggle"
        ? data.conflicts_struggle
        : data.conflicts_integration;

  const narrativeArcKey =
    woundZone === "repression"
      ? data.narrative_arc_repression
      : woundZone === "struggle"
        ? data.narrative_arc_struggle
        : data.narrative_arc_integration;

  const narrativeArc = ARC_LABEL[narrativeArcKey];

  return {
    base_type: baseType,
    archetype_name: archetypeName,
    tagline,
    core_desire: data.core_desire,
    core_fear: data.core_fear,
    wound_text: data.wound_text,
    gift_text: data.gift_text,
    shadow_text: shadowText,
    narrative_arc: narrativeArc,
    conflicts: [...conflicts],
    hooks: [...data.hooks],
    inspirations: [...data.inspirations],
  };
}
