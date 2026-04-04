import type { ReactNode } from "react";

import { AdaptiveAppShell } from "@/components/app-shell/adaptive-app-shell";
import { TopBarProvider } from "@/components/app-shell/top-bar-context";

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return (
    <TopBarProvider>
      <AdaptiveAppShell>{children}</AdaptiveAppShell>
    </TopBarProvider>
  );
}
