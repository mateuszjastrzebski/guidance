"use client";

import {
  Box,
  Combobox,
  Group,
  Input,
  Stack,
  Text,
  useCombobox
} from "@mantine/core";
import {
  IconMapPin,
  IconSearch,
  IconSwords,
  IconUser
} from "@tabler/icons-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { useTopBar } from "@/components/app-shell/top-bar-context";
import { searchCampaignItems } from "@/lib/campaign-search";

const RESULT_LIMIT = 8;

function truncateSecondaryText(value: string | null, maxLength = 88) {
  if (!value) {
    return null;
  }

  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) {
    return compact;
  }
  return `${compact.slice(0, maxLength - 1).trimEnd()}…`;
}

function ResultKindMeta({ kind, kindLabel }: { kind: "character" | "quest" | "world_entry"; kindLabel: string }) {
  const Icon = kind === "character" ? IconUser : kind === "quest" ? IconSwords : IconMapPin;

  return (
    <Group c="gray.7" gap={4} wrap="nowrap">
      <Icon size={12} stroke={1.8} />
      <Text c="inherit" size="xs">
        {kindLabel}
      </Text>
    </Group>
  );
}

export function CampaignTopBarSearch() {
  const { config } = useTopBar();
  const router = useRouter();
  const pathname = usePathname();
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption()
  });
  const hasMountedRef = useRef(false);
  const [query, setQuery] = useState("");

  const results = useMemo(
    () =>
      searchCampaignItems(
        config.variant === "campaign" ? config.campaignSearchItems : [],
        query,
        RESULT_LIMIT
      ),
    [config, query]
  );
  const shouldOpenDropdown = query.trim().length >= 2;
  const isDropdownVisible = shouldOpenDropdown && combobox.dropdownOpened;

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    setQuery("");
    combobox.closeDropdown();
  }, [pathname]);

  const openDropdownIfNeeded = () => {
    if (shouldOpenDropdown) {
      combobox.openDropdown();
      combobox.updateSelectedOptionIndex();
    }
  };

  const submitSelection = (href: string) => {
    setQuery("");
    combobox.closeDropdown();
    router.push(href);
  };

  return (
    <Box pos="relative" style={{ width: "100%" }}>
      <Combobox onOptionSubmit={submitSelection} store={combobox} withinPortal={false}>
        <Combobox.Target>
          <Input
            aria-label="Szukaj w kampanii"
            leftSection={<IconSearch size={16} stroke={1.8} />}
            onChange={(event) => {
              const nextValue = event.currentTarget.value;
              setQuery(nextValue);
              if (nextValue.trim().length >= 2) {
                combobox.openDropdown();
                combobox.updateSelectedOptionIndex();
              } else {
                combobox.closeDropdown();
              }
            }}
            onClick={openDropdownIfNeeded}
            onFocus={openDropdownIfNeeded}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                combobox.closeDropdown();
                return;
              }

              if (event.key === "Enter" && shouldOpenDropdown && results.length > 0) {
                event.preventDefault();
                submitSelection(results[0]!.href);
              }
            }}
            placeholder="Szukaj w kampanii"
            radius="xl"
            size="md"
            style={{ width: "100%" }}
            styles={{
              input: {
                backgroundColor: "var(--mantine-color-body)",
                minHeight: 40
              },
              section: {
                pointerEvents: "none"
              }
            }}
            value={query}
          />
        </Combobox.Target>

        {isDropdownVisible ? (
          <Combobox.Dropdown
            style={{
              left: 0,
              position: "absolute",
              right: 0,
              top: "calc(100% + 4px)",
              zIndex: 1000
            }}
          >
            <Combobox.Options>
              {results.length === 0 ? (
                <Combobox.Empty>Brak wyników</Combobox.Empty>
              ) : (
                results.map((result) => {
                  const secondaryText = truncateSecondaryText(result.secondaryText);

                  return (
                    <Combobox.Option key={`${result.kind}-${result.id}`} value={result.href}>
                      <Stack gap={4}>
                        <Group gap="xs" justify="space-between" wrap="nowrap">
                          <Text fw={600} lineClamp={1} size="sm">
                            {result.title}
                          </Text>
                          <ResultKindMeta kind={result.kind} kindLabel={result.kindLabel} />
                        </Group>
                        {secondaryText ? (
                          <Text c="dimmed" lineClamp={2} size="xs">
                            {secondaryText}
                          </Text>
                        ) : null}
                      </Stack>
                    </Combobox.Option>
                  );
                })
              )}
            </Combobox.Options>
          </Combobox.Dropdown>
        ) : null}
      </Combobox>
    </Box>
  );
}
