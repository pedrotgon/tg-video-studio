// SPDX-License-Identifier: Elastic-2.0
// Copyright (c) 2026 ClaymoreLab
export type SpineTemplate = "drama" | "narrated";

export interface CommercialBrCampaign {
  name: string;
  objective: string;
  primary_channel: string;
  creative_format: string;
  audience: string;
  offer: string;
  core_promise: string;
  cta: string;
  objections?: string[];
  required_terms?: string[];
  forbidden_terms?: string[];
  own_script?: string;
  tone?: string;
}

export interface CommercialBrOutput {
  variants: number;
  duration_seconds: 15 | 30 | 45 | 60;
  aspect_ratio: "9:16" | "1:1" | "4:5" | "16:9";
  captions: boolean;
}

export interface CommercialBrBrand {
  tone: string;
  primary_color: string;
  accent_color: string;
  logo_asset_id: string | null;
}

export interface CreateProjectPayload {
  name: string;
  content_profile?: "commercial_br";
  market?: "pt-BR";
  campaign?: CommercialBrCampaign;
  output?: CommercialBrOutput;
  brand?: CommercialBrBrand;
  spine_template?: SpineTemplate;
  aspect_ratio?: "2:3" | "9:16" | "16:9";
  visual_style?: string;
  narration_style?: string;
  add_subtitles?: boolean;
}

export interface ProjectConfig {
  spine_template?: SpineTemplate;
  aspect_ratio?: "2:3" | "9:16" | "16:9";
  visual_style?: string;
  narration_style?: string;
  ethnicity?: string;
  rhythm?: string;
  tts_provider?: string;
  tts_model?: string;
  tts_voice?: string;
  grid_mode?: string;
  grid_model?: string;
  video_backend?: string;
  use_director_render?: boolean;
  video_resolution?: string;
  add_subtitles?: boolean;
  sketch_image_selection?: string;
  render_image_selection?: string;
  sketch_aspect_padding?: boolean;
  content_profile?: "commercial_br" | string;
  market?: string;
  campaign?: CommercialBrCampaign;
  output?: CommercialBrOutput;
  brand?: CommercialBrBrand;
}

export type Project = string;

// Project lifecycle states. Mutually exclusive.
//   active   — working state (default)
//   archived — parked for reference, hidden from Active view
//   deleted  — soft-deleted, recoverable from Trash
export type ProjectStatus = "active" | "archived" | "deleted";

export type ProjectRole = "viewer" | "editor" | "admin" | "owner";

export interface ProjectSummary {
  id: string;
  name: string;
  internalName?: string;
  contentProfile?: string;
  market?: string;
  campaign?: CommercialBrCampaign;
  creativeCount?: number;
  status: ProjectStatus;
  ownerUsername?: string;
  ownerId?: string;
  ownerType?: "user" | "team";
  effectiveRole?: ProjectRole;
  homeNodeId?: string;
  archivedAt?: string; // ISO8601 timestamp
  deletedAt?: string; // ISO8601 timestamp
  updatedAt?: string; // ISO8601 timestamp — latest mutation on the project
  episodeCount?: number; // number of planned episodes (null for Trash)
  beatCount?: number; // number of beats across all episodes (null for Trash)
  // TODO(backend): createdAt when API returns it.
}
