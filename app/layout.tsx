import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/spotlight/styles.css";
import "./globals.css";

import { ColorSchemeScript, MantineProvider, createTheme } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { RegisterServiceWorker } from "@/components/pwa/register-sw";

const theme = createTheme({
  primaryColor: "violet",
  defaultRadius: "md"
});

export const metadata: Metadata = {
  title: "Campaign Layer",
  description: "Setup aplikacji Campaign Layer na bazie PRD.",
  applicationName: "Campaign Layer"
};

export const viewport: Viewport = {
  themeColor: "#6d28d9"
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider defaultColorScheme="auto" theme={theme}>
          <Notifications position="top-right" />
          <RegisterServiceWorker />
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
