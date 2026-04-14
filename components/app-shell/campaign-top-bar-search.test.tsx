import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";

import { CampaignTopBarSearch } from "@/components/app-shell/campaign-top-bar-search";
import { SetCampaignTopBar } from "@/components/app-shell/set-campaign-top-bar";
import { TopBarProvider } from "@/components/app-shell/top-bar-context";
import { theme } from "@/lib/styles/mantine-theme";

const pushMock = vi.fn();
const pathnameState = { value: "/campaign/c1" };

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameState.value,
  useRouter: () => ({ push: pushMock })
}));

function renderSearch() {
  return render(
    <MantineProvider theme={theme}>
      <TopBarProvider>
        <SetCampaignTopBar
          campaignCharacters={[]}
          campaignId="c1"
          campaignName="Test Campaign"
          campaignSearchItems={[
            {
              id: "quest-1",
              kind: "quest",
              title: "Król w ruinach",
              secondaryText: "Wątek o dawnym władcy.",
              searchText: "Król w ruinach Wątek o dawnym władcy.",
              href: "/campaign/c1/quests/quest-1",
              kindLabel: "Wątek"
            },
            {
              id: "world-1",
              kind: "world_entry",
              title: "Zamek króla",
              secondaryText: "Miejsce spotkań dworu.",
              searchText: "Zamek króla Miejsce spotkań dworu.",
              href: "/campaign/c1/world/miejsca/world-1",
              kindLabel: "Miejsce"
            }
          ]}
          campaignWorldCollections={[]}
        />
        <CampaignTopBarSearch />
      </TopBarProvider>
    </MantineProvider>
  );
}

describe("CampaignTopBarSearch", () => {
  beforeEach(() => {
    pushMock.mockReset();
    pathnameState.value = "/campaign/c1";
  });

  it("does not open results before two characters", () => {
    renderSearch();

    const input = screen.getByLabelText("Szukaj w kampanii");
    fireEvent.change(input, { target: { value: "k" } });

    expect(screen.queryByText("Król w ruinach")).not.toBeInTheDocument();
    expect(screen.queryByText("Brak wyników")).not.toBeInTheDocument();
  });

  it("shows results and empty state after two characters", () => {
    renderSearch();

    const input = screen.getByLabelText("Szukaj w kampanii");
    fireEvent.change(input, { target: { value: "kr" } });

    expect(screen.getByText("Król w ruinach")).toBeInTheDocument();
    expect(screen.getByText("Zamek króla")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "zz" } });

    expect(screen.getByText("Brak wyników")).toBeInTheDocument();
  });

  it("navigates with Enter and closes on Escape", () => {
    renderSearch();

    const input = screen.getByLabelText("Szukaj w kampanii");
    fireEvent.change(input, { target: { value: "kr" } });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(pushMock).toHaveBeenCalledWith("/campaign/c1/quests/quest-1");

    fireEvent.change(input, { target: { value: "kr" } });
    fireEvent.keyDown(input, { key: "Escape" });

    expect(screen.queryByText("Król w ruinach")).not.toBeInTheDocument();
  });
});
