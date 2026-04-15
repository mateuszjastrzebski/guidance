import { DEFAULT_APP_THEME, getMantineTheme } from "@/lib/styles/app-theme";

/**
 * Zachowane dla miejsc, które potrzebują prostego importu theme w testach.
 */
export const theme = getMantineTheme(DEFAULT_APP_THEME);
