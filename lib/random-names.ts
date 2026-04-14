const NPC_NAMES = [
  "Aldric Czarnopłaszcz",
  "Mira z Doliny",
  "Ser Halvard",
  "Zara Nocna Mgła",
  "Brynn Żelazna",
  "Tomas Garbarz",
  "Elara Srebrnowłosa",
  "Vorn Przeklęty",
  "Dagna Kamiennozębna",
  "Rook z Przełęczy",
  "Sael Dwuobliczna",
  "Hugo od Mostu",
];

const LOCATION_NAMES = [
  "Karczma Pod Złotym Krukiem",
  "Ruiny Starego Zamku",
  "Wioska Kamienne Pole",
  "Mglisty Przełęcz",
  "Wieża Maga",
  "Port Wschodzącego Słońca",
  "Las Szepczących Dębów",
  "Cytadela Czarnej Skały",
  "Bagna Srebrnego Węża",
  "Zakrzywiona Uliczka",
  "Klify Końca Świata",
  "Dolina Zapomniana",
];

const ORGANIZATION_NAMES = [
  "Bractwo Kruka",
  "Gildia Wiecznej Nocy",
  "Zakon Złotej Kotwicy",
  "Rada Siedmiu Pieczęci",
  "Stowarzyszenie Ślepych Kupców",
  "Klan Żelaznego Progu",
  "Liga Północnych Mieczy",
  "Kongregacja Szarego Ognia",
  "Przymierze Skruszonych",
  "Dom Bladego Księżyca",
];

const QUEST_NAMES = [
  "Cień nad miastem",
  "Zaginiona karawana",
  "Tajemnica wieży",
  "Głos z ruin",
  "Krwawa przysięga",
  "Ostatni strażnik",
  "Skradzione dziedzictwo",
  "Zmowa w porcie",
  "Nocny zleceniodawca",
  "Pieczęć dawnych bogów",
];

const CHARACTER_NAMES = [
  "Aria Keth",
  "Dorian Ash",
  "Mira Coldstone",
  "Thorn Irenveil",
  "Seraphine Dusk",
  "Cael Brightmantle",
  "Lysander Vorn",
  "Nessa Quickfen",
  "Rook Ashvale",
  "Zara Nighthollow",
];

const GENERIC_NAMES = [...NPC_NAMES, ...LOCATION_NAMES, ...ORGANIZATION_NAMES];

const NAMES_BY_TEMPLATE: Record<string, string[]> = {
  npc: NPC_NAMES,
  location: LOCATION_NAMES,
  organization: ORGANIZATION_NAMES,
};

export function getRandomNamesForTemplate(templateKey: string): string[] {
  return NAMES_BY_TEMPLATE[templateKey] ?? GENERIC_NAMES;
}

export { CHARACTER_NAMES, QUEST_NAMES };
