export type FabulaKind = "campaign" | "oneshot";

export type GameSystem = "dnd5e" | "coc" | "other";

export type FabulaRow = {
  id: string;
  name: string;
  system: string;
  fabula_kind: FabulaKind;
  cover_image_url: string | null;
  created_at?: string;
};

export function isFabulaKind(value: string): value is FabulaKind {
  return value === "campaign" || value === "oneshot";
}

export function fabulaKindLabel(kind: FabulaKind): string {
  return kind === "oneshot" ? "Jednostrzal" : "Kampania";
}

export function defaultCoverForKind(kind: FabulaKind): string {
  return kind === "oneshot" ? "/campaign-cover-oneshot.svg" : "/campaign-cover-campaign.svg";
}

export function coverImageSrc(row: Pick<FabulaRow, "cover_image_url" | "fabula_kind">): string {
  return row.cover_image_url ?? defaultCoverForKind(row.fabula_kind);
}

export const GAME_SYSTEM_OPTIONS: { value: GameSystem; label: string }[] = [
  { value: "dnd5e", label: "D&D 5e" },
  { value: "coc", label: "Call of Cthulhu" },
  { value: "other", label: "Inny" }
];
