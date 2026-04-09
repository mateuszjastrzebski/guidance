export type PrismView = "what" | "why" | "where" | "when" | "how" | "consequences";

/** Facet nodes never use `what`; that dimension is the event tile itself. */
export type PlannerFacetKind = Exclude<PrismView, "what">;

export const PRISM_VIEWS: readonly PrismView[] = [
  "what",
  "why",
  "where",
  "when",
  "how",
  "consequences"
] as const;

export const PRISM_LABELS_PL: Record<PrismView, string> = {
  what: "Co",
  why: "Dlaczego",
  where: "Gdzie",
  when: "Kiedy",
  how: "Jak",
  consequences: "Konsekwencje"
};
