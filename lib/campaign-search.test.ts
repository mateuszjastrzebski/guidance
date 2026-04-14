import { buildCampaignSearchItems, searchCampaignItems } from "@/lib/campaign-search";

describe("campaign search helpers", () => {
  it("prefers title matches over secondary text matches", () => {
    const results = searchCampaignItems(
      [
        {
          id: "quest-1",
          kind: "quest",
          title: "Król pod górą",
          secondaryText: "Wątek",
          searchText: "Król pod górą Wątek",
          href: "/campaign/c1/quests/quest-1",
          kindLabel: "Wątek"
        },
        {
          id: "world-1",
          kind: "world_entry",
          title: "Zamek na wzgórzu",
          secondaryText: "Siedziba króla",
          searchText: "Zamek na wzgórzu Siedziba króla",
          href: "/campaign/c1/world/miejsca/world-1",
          kindLabel: "Miejsce"
        }
      ],
      "król"
    );

    expect(results.map((result) => result.id)).toEqual(["quest-1", "world-1"]);
  });

  it("prefers title prefixes over other title matches and ignores diacritics", () => {
    const results = searchCampaignItems(
      [
        {
          id: "world-1",
          kind: "world_entry",
          title: "Królewski trakt",
          secondaryText: null,
          searchText: "Królewski trakt",
          href: "/campaign/c1/world/miejsca/world-1",
          kindLabel: "Miejsce"
        },
        {
          id: "world-2",
          kind: "world_entry",
          title: "Zamek króla",
          secondaryText: null,
          searchText: "Zamek króla",
          href: "/campaign/c1/world/miejsca/world-2",
          kindLabel: "Miejsce"
        }
      ],
      "krol"
    );

    expect(results.map((result) => result.id)).toEqual(["world-1", "world-2"]);
  });

  it("builds search items with hrefs and world collection labels", () => {
    const items = buildCampaignSearchItems({
      campaignId: "campaign-1",
      characters: [{ id: "char-1", name: "Aldor", level: 4 }],
      quests: [
        {
          id: "quest-1",
          name: "Spisek w dokach",
          description: "Ktoś przekupuje straże portowe.",
          status: "active"
        }
      ],
      worldEntries: [
        {
          id: "entry-1",
          name: "Kapitan Kruk",
          summary: "Dowodzi szajką przemytników.",
          world_collections: [{ slug: "npcs", singular_name: "NPC" }]
        }
      ]
    });

    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "char-1",
          href: "/campaign/campaign-1/player-characters/char-1",
          kindLabel: "Postać gracza"
        }),
        expect.objectContaining({
          id: "quest-1",
          href: "/campaign/campaign-1/quests/quest-1",
          kindLabel: "Wątek"
        }),
        expect.objectContaining({
          id: "entry-1",
          href: "/campaign/campaign-1/world/npcs/entry-1",
          kindLabel: "NPC"
        })
      ])
    );
  });
});
