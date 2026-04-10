/**
 * Tymczasowe dane demo — ta sama „drużyna” w RSVP (top bar) i na liście postaci,
 * dopóki nie opieramy UI wyłącznie na Supabase.
 */

export type DemoSessionRsvpPlayer = {
  id: string;
  name: string;
  accepted: boolean;
};

export const MOCK_SESSION_RSVP_PLAYERS: DemoSessionRsvpPlayer[] = [
  { id: "1", name: "Aria", accepted: true },
  { id: "2", name: "Borin", accepted: true },
  { id: "3", name: "Cael", accepted: false },
  { id: "4", name: "Dara", accepted: false },
  { id: "5", name: "Ewan", accepted: true }
];

export type DemoPlayerCharacterRow = {
  id: string;
  name: string;
  level: number | null;
  portrait_url: string | null;
};

/** Odpowiada kształtowi listy na stronie Postacie graczy (stabilne id prefiksowane). */
export const MOCK_DEMO_PLAYER_CHARACTERS: DemoPlayerCharacterRow[] = [
  { id: "mock-demo-pc-1", name: "Aria", level: 5, portrait_url: null },
  { id: "mock-demo-pc-2", name: "Borin", level: 4, portrait_url: null },
  { id: "mock-demo-pc-3", name: "Cael", level: 3, portrait_url: null },
  { id: "mock-demo-pc-4", name: "Dara", level: 2, portrait_url: null },
  { id: "mock-demo-pc-5", name: "Ewan", level: 6, portrait_url: null }
];
