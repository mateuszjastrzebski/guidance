import type { CampaignSearchItem } from "@/components/app-shell/top-bar-context";

export type CampaignSearchCharacterRecord = {
  id: string;
  name: string;
  level: number | null;
};

export type CampaignSearchQuestRecord = {
  id: string;
  name: string;
  description: string | null;
  status: string;
};

export type CampaignSearchWorldEntryRecord = {
  id: string;
  name: string;
  summary: string | null;
  world_collections:
    | { slug: string; singular_name: string }
    | { slug: string; singular_name: string }[]
    | null;
};

export type RankedCampaignSearchItem = CampaignSearchItem & {
  matchKind: "title_prefix" | "title_substring" | "secondary";
};

export function normalizeCampaignSearchText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function compareAlphabetically(a: string, b: string) {
  return normalizeCampaignSearchText(a).localeCompare(normalizeCampaignSearchText(b), "pl");
}

function firstWorldCollectionMeta(
  value:
    | { slug: string; singular_name: string }
    | { slug: string; singular_name: string }[]
    | null
) {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function buildCampaignSearchItems(args: {
  campaignId: string;
  characters: CampaignSearchCharacterRecord[];
  quests: CampaignSearchQuestRecord[];
  worldEntries: CampaignSearchWorldEntryRecord[];
}): CampaignSearchItem[] {
  const { campaignId, characters, quests, worldEntries } = args;

  const worldEntryItems = worldEntries
    .map((entry) => {
      const collectionMeta = firstWorldCollectionMeta(entry.world_collections);
      if (!collectionMeta?.slug || !collectionMeta.singular_name) {
        return null;
      }

      return {
        id: entry.id,
        kind: "world_entry" as const,
        title: entry.name,
        secondaryText: entry.summary?.trim() || collectionMeta.singular_name,
        searchText: `${entry.name} ${entry.summary ?? ""} ${collectionMeta.singular_name}`,
        href: `/campaign/${campaignId}/world/${collectionMeta.slug}/${entry.id}`,
        kindLabel: collectionMeta.singular_name
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  return [
    ...characters.map((character) => ({
      id: character.id,
      kind: "character" as const,
      title: character.name,
      secondaryText: character.level != null ? `Poziom ${character.level}` : "Postać gracza",
      searchText: `${character.name} postać gracza ${
        character.level != null ? `poziom ${character.level}` : ""
      }`,
      href: `/campaign/${campaignId}/player-characters/${character.id}`,
      kindLabel: "Postać gracza"
    })),
    ...quests.map((quest) => ({
      id: quest.id,
      kind: "quest" as const,
      title: quest.name,
      secondaryText: quest.description?.trim() || `Status: ${quest.status}`,
      searchText: `${quest.name} ${quest.description ?? ""} ${quest.status} wątek zadanie`,
      href: `/campaign/${campaignId}/quests/${quest.id}`,
      kindLabel: "Wątek"
    })),
    ...worldEntryItems
  ];
}

export function searchCampaignItems(
  items: CampaignSearchItem[],
  query: string,
  limit = 8
): RankedCampaignSearchItem[] {
  const normalizedQuery = normalizeCampaignSearchText(query);
  if (normalizedQuery.length < 2) {
    return [];
  }

  const ranked = items
    .map((item) => {
      const normalizedTitle = normalizeCampaignSearchText(item.title);
      const normalizedSecondary = normalizeCampaignSearchText(item.secondaryText ?? "");
      const normalizedSearchText = normalizeCampaignSearchText(item.searchText);

      let rank: 0 | 1 | 2 | null = null;
      let matchKind: RankedCampaignSearchItem["matchKind"] | null = null;

      if (normalizedTitle.startsWith(normalizedQuery)) {
        rank = 0;
        matchKind = "title_prefix";
      } else if (normalizedTitle.includes(normalizedQuery)) {
        rank = 1;
        matchKind = "title_substring";
      } else if (
        normalizedSecondary.includes(normalizedQuery) ||
        normalizedSearchText.includes(normalizedQuery)
      ) {
        rank = 2;
        matchKind = "secondary";
      }

      if (rank === null || matchKind === null) {
        return null;
      }

      return {
        item,
        matchKind,
        rank
      };
    })
    .filter((value): value is { item: CampaignSearchItem; matchKind: RankedCampaignSearchItem["matchKind"]; rank: 0 | 1 | 2 } => value !== null)
    .sort((a, b) => {
      if (a.rank !== b.rank) {
        return a.rank - b.rank;
      }
      return compareAlphabetically(a.item.title, b.item.title);
    })
    .slice(0, limit)
    .map(({ item, matchKind }) => ({
      ...item,
      matchKind
    }));

  return ranked;
}
