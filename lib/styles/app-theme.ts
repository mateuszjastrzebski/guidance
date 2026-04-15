import { createTheme } from "@mantine/core";

export const APP_THEME_STORAGE_KEY = "guidance-app-theme";

export const appThemeOptions = [
  {
    value: "violet",
    label: "Klasyczny",
    description: "Obecny motyw aplikacji z fioletowym primary."
  },
  {
    value: "parchment",
    label: "Guidance",
    description: "Ciepła paleta inspirowana obecną stroną główną."
  }
] as const;

export type AppThemeName = (typeof appThemeOptions)[number]["value"];

export const DEFAULT_APP_THEME: AppThemeName = "violet";

export function isAppThemeName(value: string | null | undefined): value is AppThemeName {
  return appThemeOptions.some((option) => option.value === value);
}

const violetTheme = createTheme({
  primaryColor: "violet",
  defaultRadius: "md"
});

const parchmentTheme = createTheme({
  primaryColor: "earth",
  defaultRadius: "md",
  colors: {
    earth: [
      "#f7efe4",
      "#efdfca",
      "#e6cfaf",
      "#ddb88f",
      "#d59f68",
      "#cf8d52",
      "#cb8346",
      "#b37038",
      "#a06431",
      "#8c5427"
    ],
    forest: [
      "#edf5ef",
      "#dce8df",
      "#b8d2be",
      "#91bb9b",
      "#70a57d",
      "#5a9868",
      "#4d915d",
      "#3c7e4d",
      "#336f43",
      "#295f37"
    ]
  },
  primaryShade: 6
});

const themes: Record<AppThemeName, typeof violetTheme> = {
  violet: violetTheme,
  parchment: parchmentTheme
};

export function getMantineTheme(themeName: AppThemeName) {
  return themes[themeName];
}
