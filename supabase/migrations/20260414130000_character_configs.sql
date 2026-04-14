CREATE TABLE character_configs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  world_entry_id   uuid NOT NULL REFERENCES world_entries(id) ON DELETE CASCADE,
  campaign_id      uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,

  -- Slider values (1–10)
  slider_heart     integer NOT NULL CHECK (slider_heart BETWEEN 1 AND 10),
  slider_soul      integer NOT NULL CHECK (slider_soul BETWEEN 1 AND 10),
  slider_mask      integer NOT NULL CHECK (slider_mask BETWEEN 1 AND 10),
  slider_wound     integer NOT NULL CHECK (slider_wound BETWEEN 1 AND 10),
  slider_bonds     integer CHECK (slider_bonds BETWEEN 1 AND 10),
  slider_code      integer CHECK (slider_code BETWEEN 1 AND 10),

  -- Generated output (cached, recalculated on slider change)
  base_type        text NOT NULL,
  archetype_name   text NOT NULL,
  tagline          text NOT NULL,
  core_desire      text NOT NULL,
  core_fear        text NOT NULL,
  wound_text       text NOT NULL,
  gift_text        text NOT NULL,
  shadow_text      text NOT NULL,
  narrative_arc    text NOT NULL,
  conflicts        jsonb NOT NULL DEFAULT '[]',
  hooks            jsonb NOT NULL DEFAULT '[]',
  inspirations     jsonb NOT NULL DEFAULT '[]',

  generated_at     timestamptz NOT NULL DEFAULT now(),
  created_at       timestamptz NOT NULL DEFAULT now(),

  UNIQUE (world_entry_id)
);

CREATE INDEX idx_cc_campaign ON character_configs(campaign_id);

ALTER TABLE character_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaign members can view character_configs"
  ON character_configs FOR SELECT
  USING (app_is_campaign_member(campaign_id));

CREATE POLICY "campaign gm can manage character_configs"
  ON character_configs FOR ALL
  USING (app_is_campaign_gm(campaign_id))
  WITH CHECK (app_is_campaign_gm(campaign_id));
