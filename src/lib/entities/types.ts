import { z } from "zod";

export const ENTITY_TYPES = [
  "character",
  "location",
  "faction",
  "race",
  "nation",
  "religion",
  "magic_system",
  "skill",
  "item",
  "creature",
  "event",
  "arc",
  "scene",
  "timeline",
  "relationship",
  "lore",
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

// Structured metadata per entity type
export const CharacterMeta = z.object({
  role: z.string().optional(),
  age: z.string().optional(),
  gender: z.string().optional(),
  race: z.string().optional(),
  faction: z.string().optional(),
  arc_position: z.number().min(0).max(1).default(0),
  emotional_state: z.object({
    dominant: z.string().optional(),
    secondary: z.string().optional(),
    suppressed: z.string().optional(),
  }).default({}),
  goals: z.array(z.object({
    goal: z.string(),
    urgency: z.number().min(1).max(10).default(5),
    progress: z.number().min(0).max(1).default(0),
  })).default([]),
  fears: z.array(z.string()).default([]),
  knowledge: z.record(z.string(), z.boolean()).default({}),
  speech_patterns: z.string().optional(),
  physical_description: z.string().optional(),
  introduced_in: z.string().optional(),
  status: z.enum(["alive", "dead", "unknown", "missing"]).default("alive"),
});

export const LocationMeta = z.object({
  type: z.string().optional(),
  region: z.string().optional(),
  nation: z.string().optional(),
  atmosphere: z.string().optional(),
  population: z.string().optional(),
  rules: z.array(z.string()).default([]),
  sensory_details: z.string().optional(),
});

export const FactionMeta = z.object({
  type: z.string().optional(),
  ideology: z.string().optional(),
  goals: z.array(z.string()).default([]),
  enemies: z.array(z.string()).default([]),
  allies: z.array(z.string()).default([]),
  power_level: z.number().min(1).max(10).default(5),
  status: z.enum(["active", "dissolved", "hidden", "rising", "declining"]).default("active"),
});

export const MagicSystemMeta = z.object({
  cost: z.string().optional(),
  limits: z.array(z.string()).default([]),
  source: z.string().optional(),
  rules: z.array(z.string()).default([]),
  hard_magic: z.boolean().default(true),
});

export const ItemMeta = z.object({
  type: z.string().optional(),
  rarity: z.string().optional(),
  magical: z.boolean().default(false),
  abilities: z.array(z.string()).default([]),
  current_owner: z.string().optional(),
  location: z.string().optional(),
});

export const EventMeta = z.object({
  date: z.string().optional(),
  location: z.string().optional(),
  participants: z.array(z.string()).default([]),
  consequences: z.array(z.string()).default([]),
  type: z.string().optional(),
  chapter_reference: z.string().optional(),
});

export const ArcMeta = z.object({
  order: z.number().default(0),
  status: z.enum(["planned", "drafting", "complete"]).default("planned"),
  chapters: z.array(z.string()).default([]),
  theme: z.string().optional(),
  emotional_arc: z.string().optional(),
  tension_start: z.number().min(1).max(10).default(3),
  tension_peak: z.number().min(1).max(10).default(8),
  tension_end: z.number().min(1).max(10).default(5),
});

// Base entity schema
export const EntitySchema = z.object({
  id: z.string(),
  type: z.enum(ENTITY_TYPES),
  name: z.string(),
  slug: z.string(),
  description: z.string().default(""),
  rich_content: z.string().default(""),          // Markdown
  metadata: z.record(z.string(), z.unknown()).default({}),   // Type-specific structured state
  tags: z.array(z.string()).default([]),
  importance: z.number().min(1).max(10).default(5),
  cover_asset_id: z.string().optional(),
  ai_summary: z.string().optional(),
  version: z.number().default(1),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Entity = z.infer<typeof EntitySchema>;

// Relationship between entities
export const RelationshipSchema = z.object({
  id: z.string(),
  source_id: z.string(),
  source_name: z.string(),
  target_id: z.string(),
  target_name: z.string(),
  type: z.string(),   // "knows", "member_of", "lives_in", "enemy_of", "created_by", etc.
  label: z.string().optional(),
  weight: z.number().min(0).max(1).default(0.5),
  bidirectional: z.boolean().default(false),
  metadata: z.record(z.string(), z.unknown()).default({}),
  created_at: z.string(),
});

export type Relationship = z.infer<typeof RelationshipSchema>;

// Asset
export const AssetSchema = z.object({
  id: z.string(),
  entity_id: z.string().optional(),
  type: z.enum(["cover", "portrait", "location", "map", "icon", "moodboard", "reference", "generated"]),
  filename: z.string(),
  storage_path: z.string(),     // relative to assets/
  url: z.string().optional(),   // CDN URL if available
  mime_type: z.string(),
  size: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  alt: z.string().optional(),
  tags: z.array(z.string()).default([]),
  version: z.number().default(1),
  created_at: z.string(),
});

export type Asset = z.infer<typeof AssetSchema>;

// Plot thread
export const PlotThreadSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.enum(["setup", "active", "climax", "resolved", "abandoned"]).default("setup"),
  tension_level: z.number().min(1).max(10).default(5),
  introduced_in: z.string().optional(),
  resolved_in: z.string().optional(),
  involved_entities: z.array(z.string()).default([]),
  hooks: z.array(z.string()).default([]),
  foreshadowing: z.array(z.string()).default([]),
  importance: z.number().min(1).max(10).default(5),
  created_at: z.string(),
  updated_at: z.string(),
});

export type PlotThread = z.infer<typeof PlotThreadSchema>;

// Memory chunk (compressed scene summary)
export const MemoryChunkSchema = z.object({
  id: z.string(),
  source_id: z.string(),       // chapter slug
  tier: z.enum(["full", "compact", "ultra"]),
  content: z.string(),
  state_deltas: z.record(z.string(), z.unknown()).default({}),
  importance: z.number().min(1).max(10).default(5),
  characters: z.array(z.string()).default([]),
  locations: z.array(z.string()).default([]),
  topics: z.array(z.string()).default([]),
  emotional_beat: z.string().optional(),
  hooks: z.array(z.string()).default([]),
  embedding: z.array(z.number()).optional(),   // local vector
  created_at: z.string(),
});

export type MemoryChunk = z.infer<typeof MemoryChunkSchema>;
