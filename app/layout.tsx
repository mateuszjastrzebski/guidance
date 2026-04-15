import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/spotlight/styles.css";
import "./globals.css";

import {
  ColorSchemeScript,
  mantineHtmlProps
} from "@mantine/core";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import { AppThemeProvider } from "@/components/theme/app-theme-provider";
import { APP_THEME_STORAGE_KEY, DEFAULT_APP_THEME } from "@/lib/styles/app-theme";

export const metadata: Metadata = {
  title: "Guidance",
  description:
    "Guidance pomaga prowadzić kampanie TTRPG: planner fabuły, baza świata, roster postaci i dashboard sesji w jednym miejscu.",
  applicationName: "Guidance"
};

export const viewport: Viewport = {
  themeColor: "#6b4b35"
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html data-app-theme={DEFAULT_APP_THEME} lang="pl" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var storedTheme = localStorage.getItem(${JSON.stringify(APP_THEME_STORAGE_KEY)});
                if (storedTheme) {
                  document.documentElement.dataset.appTheme = storedTheme;
                }
              } catch {}
            `
          }}
        />
      </head>
      <body>
        <AppThemeProvider>
          <RegisterServiceWorker />
          {children}
        </AppThemeProvider>
      </body>
    </html>
  );
}
