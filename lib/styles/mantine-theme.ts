import { createTheme } from "@mantine/core";

/**
 * Centralny motyw Mantine dla Campaign Layer.
 *
 * Wydzielony do osobnego pliku, żeby layout.tsx pozostał krótki,
 * a zmiany w design systemie nie powodowały diff-ów w root layout.
 */
export const theme = createTheme({
  primaryColor: "violet",
  defaultRadius: "md"
});
