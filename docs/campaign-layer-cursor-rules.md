# Campaign Layer — Cursor AI Guidelines

> **Dokument:** `docs/campaign-layer-cursor-rules.md`
> **Wersja:** v1.0
> **Data:** 2026-04-04
> **Autor:** Campaign Layer / solo
> **Przeznaczenie:** Plik reguł dla Cursor AI — wytyczne generowania kodu, architektury i workflow

---

## Najważniejsze zasady w pigułce (TLDR)

1. **RLS jest fundamentem bezpieczeństwa** — nigdy nie usuwaj ani nie osłabiaj polityk Row Level Security. Każdy gracz widzi TYLKO to, co mu odblokowano.
2. **Nigdy nie wysyłaj `knowledge_nodes` do gracza bez sprawdzenia `knowledge_unlocks`** — to łamie core mechanic produktu.
3. **`isGM` zawsze pochodzi z serwera** — nigdy nie ufaj klaimom po stronie klienta.
4. **Typy generuj z bazy** — `supabase gen types typescript` po każdej zmianie schematu. Nigdy nie pisz typów bazy ręcznie.
5. **Jeden feature na raz** — rozbijaj zadania na atomowe taski, jeden branch = jedna funkcja.
6. **Server Components domyślnie** — `"use client"` tylko gdy konieczne (hooki, handlery, Zustand).
7. **Plik testów przed implementacją** — `scene-card.test.tsx` powstaje PRZED `scene-card.tsx`.
8. **Migracje przeglądaj ręcznie** — nigdy nie uruchamiaj `supabase db push` bez przeczytania SQL-a linia po linii.
9. **Elementy GM-only nie istnieją w DOM gracza** — nie ukrywaj CSS-em, nie renderuj wcale.
10. **Komentuj DLACZEGO, nie CO** — każde zapytanie RLS-sensitive musi mieć komentarz o granicy bezpieczeństwa.

---

## 1. Preambuła / Kontekst projektu

### Opis produktu

**Campaign Layer** to aplikacja webowa do zarządzania kampaniami TTRPG (tabletop RPG). Kluczowa mechanika: **asymetria wiedzy** — Mistrz Gry (MG) kontroluje, które informacje (węzły wiedzy) są widoczne dla poszczególnych graczy. To nie jest wiki — to narzędzie, w którym MG aktywnie gate'uje dostęp do lore'u.

### Stack technologiczny

| Warstwa | Technologia |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript (`strict`) |
| UI | Mantine (AppShell, NavLink, Spotlight, Tabs, Drawer, Timeline, Badge, Card, Checkbox, Modal, Notification, Progress, Textarea, TextInput, Select, Button) |
| Baza danych | Supabase (PostgreSQL + RLS + Auth + Storage) |
| Hosting | Vercel |
| Mapa | React Flow / xyflow (v1.1) |
| State | Zustand (UI state) + React Query (server state) |
| AI | OpenAI GPT-4o (v1.1 sugestie), OpenAI Whisper API (v1.2 transkrypcja) |
| Mobile | PWA (MVP), Capacitor (v1.1) |

### Kluczowe ograniczenia

- **Solo developer** — projektant UX budujący platformę z Cursorem. Nie ma zespołu do code review.
- **Cursor-driven development** — AI generuje większość kodu. Dlatego ten dokument istnieje: aby AI generował spójny, bezpieczny kod.
- **Bezpieczeństwo asymetrii wiedzy** — jedyny nietypowy wymóg techniczny. RLS to nie „nice to have", to rdzeń produktu.

### Kluczowe pojęcia domenowe

| Termin PL | Termin EN | Opis |
|---|---|---|
| MG (Mistrz Gry) | GM (Game Master) | Prowadzący kampanię, ma pełny dostęp |
| Gracz | Player | Uczestnik kampanii, widzi tylko odblokowaną wiedzę |
| Scena | Scene | Jednostka narracyjna w sesji |
| KnowledgeNode | KnowledgeNode | Węzeł wiedzy/lore — może być odblokowany per gracz |
| knowledge_unlock | knowledge_unlock | Moment, gdy MG ujawnia KnowledgeNode konkretnemu graczowi |
| Lens | Lens | Tryb widoku: Session Lens, Map Lens, Player Lens |
| Quick Capture | Quick Capture | Szybkie notatki podczas sesji na żywo |
| Kampania | Campaign | Nadrzędny kontener — jedna gra RPG |

### Scope MVP

- **Session Lens** — lista sesji + widok szczegółowy scen
- **Player Lens** — timeline gracza z odblokowaną wiedzą
- **Map Lens** — wyłącznie w v1.1

---

## 2. Workflow pracy z Cursorem

### Cykl pracy: Task → Branch → Commit → PR

```
1. Zdefiniuj JEDEN atomowy task (np. "dodaj modal odblokowania wiedzy")
2. Utwórz branch: git checkout -b feature/wiedza-unlock-modal
3. Napisz typy i interfejsy NAJPIERW
4. Napisz testy PRZED implementacją
5. Implementuj z Cursorem
6. git diff — przejrzyj KAŻDĄ zmianę
7. Uruchom testy: npm run test
8. Commit (Conventional Commits PL)
9. Push + PR (nawet jako solo dev)
```

### Rozbijanie feature'ów na atomowe taski

Każdy task dla Cursora powinien być jednym z:
- Napisz typy/interfejsy dla domeny X
- Napisz migrację SQL dla tabeli Y
- Napisz testy dla komponentu Z
- Zaimplementuj komponent Z
- Napisz hook `useX`
- Dodaj API route `/api/x`
- Dodaj politykę RLS dla tabeli Y

**⚠️ WAŻNE:** Nigdy nie łącz wielu feature'ów w jeden task. „Dodaj SceneCard i KnowledgeUnlockModal" to DWA taski.

### Zasady bezwzględne

| Zasada | Dlaczego |
|---|---|
| Nigdy nie implementuj więcej niż jednego feature'a na raz | Łatwiejsze review, mniejsze ryzyko regresji |
| Zawsze pisz testy przed implementacją | Test definiuje oczekiwane zachowanie |
| Zawsze przeglądaj migracje SQL przed uruchomieniem | AI może wygenerować destrukcyjny SQL |
| Najpierw typy i interfejsy, potem implementacja | Typy to kontrakt — implementacja go wypełnia |
| Nigdy nie uruchamiaj `supabase db push` bez review | Migracja może usunąć dane, osłabić RLS |
| Po każdej sesji Cursora: `git diff` | Weryfikuj, co AI zmienił — nie ufaj ślepo |

### Checkpoint po sesji Cursora

```bash
# 1. Co się zmieniło?
git diff --stat
git diff

# 2. Czy testy przechodzą?
npm run test

# 3. Czy typy się zgadzają?
npx tsc --noEmit

# 4. Czy nie ma nowych any/as?
grep -rn "as any\|: any" src/ --include="*.ts" --include="*.tsx"

# 5. Commit
git add -A
git commit -m "feat(domena): opis zmian"
```

---

## 3. Struktura folderów i plików

```
campaign-layer/
├── public/
│   ├── manifest.json            — PWA manifest
│   ├── icons/                   — PWA ikony
│   └── sw.js                    — Service Worker (next-pwa)
├── supabase/
│   ├── migrations/              — wszystkie migracje SQL (committed to git)
│   │   ├── 20260404_initial_schema.sql
│   │   └── 20260404_add_session_transcripts.sql
│   ├── seed.sql                 — dane testowe
│   └── config.toml
├── src/
│   ├── app/                     — Next.js App Router pages
│   │   ├── layout.tsx           — root layout (MantineProvider, Supabase)
│   │   ├── page.tsx             — landing / redirect
│   │   ├── (auth)/              — publiczne strony auth
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── invite/
│   │   │       └── page.tsx
│   │   ├── (app)/               — autentykowane strony (chronione middleware)
│   │   │   ├── layout.tsx       — AppShell z nawigacją
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx     — lista kampanii
│   │   │   └── kampania/
│   │   │       └── [id]/
│   │   │           ├── layout.tsx
│   │   │           ├── page.tsx — redirect do sesja/
│   │   │           ├── sesja/
│   │   │           │   ├── page.tsx          — Session Lens (lista)
│   │   │           │   └── [sessionId]/
│   │   │           │       └── page.tsx      — Session Lens (detail)
│   │   │           ├── mapa/
│   │   │           │   └── page.tsx          — Map Lens (v1.1, placeholder)
│   │   │           └── gracz/
│   │   │               ├── page.tsx          — Player Lens (lista graczy/postaci)
│   │   │               └── [characterId]/
│   │   │                   └── page.tsx      — Player Lens (timeline)
│   │   └── api/
│   │       └── campaigns/
│   │           └── [id]/
│   │               ├── route.ts
│   │               ├── scenes/
│   │               │   └── route.ts
│   │               ├── unlock/
│   │               │   └── route.ts          — knowledge unlock endpoint
│   │               └── captures/
│   │                   └── route.ts          — Quick Capture endpoint
│   ├── components/
│   │   ├── ui/                  — czyste wrappery Mantine (zero logiki biznesowej)
│   │   │   ├── page-header.tsx
│   │   │   ├── status-badge.tsx
│   │   │   ├── empty-state.tsx
│   │   │   └── loading-skeleton.tsx
│   │   └── features/            — komponenty per domena
│   │       ├── sceny/
│   │       │   ├── scene-card.tsx
│   │       │   ├── scene-card.test.tsx
│   │       │   ├── scene-list.tsx
│   │       │   ├── scene-detail.tsx
│   │       │   └── scene-form.tsx
│   │       ├── npcs/
│   │       │   ├── npc-card.tsx
│   │       │   ├── npc-detail.tsx
│   │       │   └── npc-interaction-list.tsx
│   │       ├── wiedza/           — knowledge nodes
│   │       │   ├── knowledge-node-card.tsx
│   │       │   ├── knowledge-unlock-modal.tsx
│   │       │   ├── knowledge-unlock-modal.test.tsx
│   │       │   ├── knowledge-timeline.tsx
│   │       │   └── knowledge-tree.tsx       — v1.1 (stub)
│   │       ├── questy/
│   │       │   ├── quest-card.tsx
│   │       │   └── quest-tracker.tsx
│   │       ├── gracz/
│   │       │   ├── player-timeline.tsx
│   │       │   ├── player-card.tsx
│   │       │   └── character-sheet.tsx
│   │       ├── sesja/
│   │       │   ├── session-lens.tsx
│   │       │   ├── quick-capture.tsx
│   │       │   └── quick-capture.test.tsx
│   │       ├── mapa/             — v1.1 (stub)
│   │       │   └── .gitkeep
│   │       └── nagrywanie/       — v1.2 (stub)
│   │           └── .gitkeep
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts        — createBrowserClient (client-side, real-time only)
│   │   │   ├── server.ts        — createServerComponentClient (Server Components)
│   │   │   ├── admin.ts         — createClient z service_role (API routes only)
│   │   │   └── middleware.ts    — auth middleware dla (app) routes
│   │   ├── types/
│   │   │   ├── database.types.ts — WYGENEROWANY: supabase gen types typescript
│   │   │   ├── scene.types.ts
│   │   │   ├── knowledge.types.ts
│   │   │   ├── campaign.types.ts
│   │   │   ├── player.types.ts
│   │   │   ├── quest.types.ts
│   │   │   └── audio.types.ts   — v1.2 (stub z TODO)
│   │   ├── hooks/
│   │   │   ├── use-campaign.ts
│   │   │   ├── use-active-scene.ts
│   │   │   ├── use-knowledge-unlock.ts
│   │   │   ├── use-quick-capture.ts
│   │   │   └── use-realtime-subscription.ts
│   │   ├── utils/
│   │   │   ├── format-date.ts
│   │   │   ├── format-date.test.ts
│   │   │   ├── role-check.ts
│   │   │   └── scene-helpers.ts
│   │   └── constants/
│   │       ├── scene-status.ts
│   │       ├── lens-types.ts
│   │       ├── breakpoints.ts
│   │       └── roles.ts
│   ├── store/
│   │   ├── use-campaign-store.ts
│   │   ├── use-session-store.ts
│   │   ├── use-knowledge-store.ts
│   │   ├── use-ui-store.ts
│   │   └── use-audio-store.ts   — v1.2 (stub)
│   └── styles/
│       ├── globals.css
│       └── mantine-theme.ts     — nadpisania Mantine theme
├── .env.example                 — szablon zmiennych (committed)
├── .env.local                   — prawdziwe wartości (NIGDY w git)
├── capacitor.config.ts          — v1.1 (utworzony, nieużywany w MVP)
├── next.config.js
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
└── package.json
```

### Filozofia struktury

**Grupowanie po domenie, nie po warstwie technicznej.** Wszystkie pliki dotyczące wiedzy (`knowledge-node-card.tsx`, `knowledge-unlock-modal.tsx`, `knowledge-timeline.tsx`) leżą w `components/features/wiedza/`, a nie rozrzucone po `components/`, `modals/`, `timelines/`.

Wyjątek: `lib/` jest pogrupowane technicznie (hooks, utils, types), bo te moduły są współdzielone między domenami.

**⚠️ WAŻNE:** Folder `components/ui/` zawiera WYŁĄCZNIE czyste wrappery Mantine bez logiki biznesowej. Jeśli komponent wie cokolwiek o kampaniach, scenach czy wiedzy — należy do `components/features/`.

---

## 4. Nazewnictwo (Naming conventions)

### Pliki — kebab-case

```
scene-card.tsx
scene-card.test.tsx
use-knowledge-unlock.ts
knowledge.types.ts
use-campaign-store.ts
format-date.ts
```

**⚠️ WAŻNE:** Żadnych PascalCase w nazwach plików. Nawet dla komponentów React.

### Komponenty — PascalCase export

```tsx
// Plik: scene-card.tsx
export function SceneCard({ scena, isGM }: SceneCardProps) { ... }

// Plik: knowledge-unlock-modal.tsx
export function KnowledgeUnlockModal({ nodeId, characterId }: KnowledgeUnlockModalProps) { ... }
```

### Hooki — prefix `use`, camelCase

```ts
useKnowledgeUnlock()
useActiveScene()
useCampaign(campaignId)
useQuickCapture()
useRealtimeSubscription(channel)
```

### Zustand stores — `use[Domain]Store`

```ts
useSessionStore()
useCampaignStore()
useKnowledgeStore()
useUIStore()
useAudioStore()    // v1.2
```

### Typy Supabase — generowane, nigdy ręczne

```bash
# Po KAŻDEJ zmianie schematu:
supabase gen types typescript --local > src/lib/types/database.types.ts
```

**🚨 KRYTYCZNE:** Nigdy nie pisz typów bazy danych ręcznie. Zawsze generuj z `supabase gen types`.

### Kolumny w bazie — snake_case

```sql
-- PostgreSQL convention
campaign_id, player_id, knowledge_node_id, hidden_notes, created_at
```

### Interfejsy TypeScript

```ts
// Interfejsy domenowe — bez prefiksu I
interface Scene { ... }
interface KnowledgeNode { ... }
interface Campaign { ... }

// Interfejsy serwisowe — prefiks I (rzadko)
interface IAuthService { ... }
interface IStorageService { ... }
```

### Stałe i enumy

```ts
// Stałe — UPPER_SNAKE_CASE
const SCENE_STATUS = { PREPARED: 'prepared', IMPROVISED: 'improvised' } as const;
const MAX_QUICK_CAPTURE_LENGTH = 2000;
const MOBILE_BREAKPOINT = 768;

// TypeScript enums — PascalCase
enum SceneStatus {
  Prepared = 'prepared',
  Improvised = 'improvised',
  Completed = 'completed',
  Suspended = 'suspended',
}
```

### Event handlery — prefix `handle`

```tsx
function handleSceneSelect(sceneId: string) { ... }
function handleKnowledgeUnlock(nodeId: string, characterId: string) { ... }
function handleQuickCaptureSave() { ... }
```

### Zmienne boolowskie — prefix `is`/`has`/`can`

```ts
const isGM = member.role === 'gm';
const hasAccess = unlocks.includes(nodeId);
const canUnlock = isGM && !isAlreadyUnlocked;
const isOffline = !navigator.onLine;
const hasUnsavedCaptures = captureQueue.length > 0;
```

### API routes — konwencja App Router

```
src/app/api/campaigns/[id]/route.ts           — GET, PUT kampanii
src/app/api/campaigns/[id]/scenes/route.ts     — GET, POST scen
src/app/api/campaigns/[id]/unlock/route.ts     — POST unlock wiedzy
src/app/api/campaigns/[id]/captures/route.ts   — POST Quick Capture
```

---

## 5. Komentowanie kodu

### Język komentarzy

- **Polski** — komentarze o logice biznesowej, domenowej, RLS
- **Angielski** — komentarze techniczne w generycznych narzędziach (`lib/utils/`)

```ts
// ✅ Dobrze — polski, wyjaśnia DLACZEGO
// Gracz widzi tylko odblokowane węzły — nigdy GM-only content
const visibleNodes = nodes.filter(n => unlocks.has(n.id));

// ✅ Dobrze — angielski w generycznym utilsie
// Truncate to nearest word boundary to avoid cutting mid-word
export function truncateText(text: string, maxLength: number): string { ... }

// ❌ Źle — komentarz "co" zamiast "dlaczego"
// Filtrujemy węzły
const visibleNodes = nodes.filter(n => unlocks.has(n.id));
```

### Komentarze RLS-sensitive — obowiązkowe

**🚨 KRYTYCZNE:** Każde zapytanie Supabase dotyczące tabel z politykami RLS MUSI mieć komentarz wyjaśniający granicę bezpieczeństwa.

```ts
// RLS: knowledge_nodes widoczne tylko dla MG kampanii.
// Polityka `knowledge_nodes_select_gm` sprawdza campaign_members.role = 'gm'.
// Gracz NIGDY nie powinien widzieć tego zapytania — dane filtrowane na poziomie bazy.
const { data: nodes } = await supabase
  .from('knowledge_nodes')
  .select('id, title, content, scene_id')
  .eq('campaign_id', campaignId);
```

### Komentarze knowledge_unlock — obowiązkowe

```ts
// Unlock wiedzy: MG ujawnia węzeł "Sekret Mrocznej Wieży" graczowi Kael.
// Trigger: MG kliknął checkbox przy węźle w panelu sceny.
// Efekt: gracz zobaczy ten węzeł w swoim Player Lens timeline.
await supabase
  .from('knowledge_unlocks')
  .insert({ knowledge_node_id: nodeId, character_id: characterId, unlocked_by: gmUserId });
```

### Wersjonowane TODO

```ts
// TODO(v1.1) — dodaj React Flow do Map Lens (xyflow)
// TODO(v1.1) — integracja GPT-4o do sugestii AI w scenach
// TODO(v1.2) — nagrywanie sesji: MediaRecorder → Supabase Storage
// TODO(v1.2) — transkrypcja Whisper: Edge Function → session_transcripts
```

**⚠️ WAŻNE:** Nigdy nie zostawiaj TODO bez numeru wersji. `// TODO — zrobić później` jest zabronione.

### JSDoc dla eksportów

```ts
/**
 * Hook do odblokowywania węzłów wiedzy przez MG.
 *
 * Wykonuje INSERT do knowledge_unlocks i invaliduje cache React Query.
 * Tylko MG kampanii może wywołać tę operację — walidacja server-side.
 *
 * @param campaignId - ID kampanii
 * @returns Mutacja unlock z obsługą optimistic update
 */
export function useKnowledgeUnlock(campaignId: string) { ... }
```

### Zasady absolutne

- **Tylko komentarze „dlaczego"** — nigdy „co"
- **Zakomentowany kod jest zabroniony** — usuwaj lub używaj feature flagów
- **Każdy eksportowany hook i funkcja ma JSDoc**
- **Komentarze RLS przy KAŻDYM zapytaniu do tabel z politykami**

---

## 6. TypeScript — zasady ścisłe

### Konfiguracja

```json
// tsconfig.json — kluczowe ustawienia
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true
  }
}
```

**🚨 KRYTYCZNE:** `strict: true` zawsze — bez wyjątków. Nigdy nie dodawaj `@ts-ignore` ani `@ts-expect-error` bez komentarza wyjaśniającego dlaczego.

### Zakaz `any`

```ts
// ❌ ZABRONIONE
function processData(data: any) { ... }
const result = response as any;

// ✅ Poprawnie — użyj unknown i zawęź typ
function processData(data: unknown) {
  if (isScene(data)) {
    // teraz TypeScript wie, że to Scene
  }
}

// ✅ Poprawnie — wygenerowane typy Supabase
import { Database } from '@/lib/types/database.types';
type Scene = Database['public']['Tables']['scenes']['Row'];
```

### Typy domenowe — jeden plik per domena

```ts
// src/lib/types/scene.types.ts

import { Database } from './database.types';

/** Wiersz tabeli scenes — wygenerowany typ */
type SceneRow = Database['public']['Tables']['scenes']['Row'];

/** Status sceny — discriminated union */
type SceneStatus = 'prepared' | 'improvised' | 'completed' | 'suspended';

/** Scena wzbogacona o relacje — do użycia w komponentach */
interface SceneWithNPCs extends SceneRow {
  npcs: NPCRow[];
  knowledgeNodes: KnowledgeNodeRow[];
}

/** Props dla komponentu SceneCard */
interface SceneCardProps {
  scena: SceneWithNPCs;
  isGM: boolean;
  onSelect: (sceneId: string) => void;
}
```

```ts
// src/lib/types/knowledge.types.ts

type KnowledgeNodeRow = Database['public']['Tables']['knowledge_nodes']['Row'];
type KnowledgeUnlockRow = Database['public']['Tables']['knowledge_unlocks']['Row'];

/** Status widoczności węzła dla konkretnego gracza */
type KnowledgeVisibility = 'locked' | 'unlocked' | 'gm_only';

/** Węzeł wiedzy z informacją o odblokowaniu */
interface KnowledgeNodeWithUnlock extends KnowledgeNodeRow {
  isUnlocked: boolean;
  unlockedAt: string | null;
}
```

### Discriminated unions

```ts
// Status sceny
type SceneStatus = 'prepared' | 'improvised' | 'completed' | 'suspended';

// Typ lensu
type LensType = 'session' | 'map' | 'player';

// Status transkrypcji (v1.2)
type TranscriptStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Rola w kampanii
type CampaignRole = 'gm' | 'player';
```

### Typowanie Server Components

```tsx
// ✅ Poprawnie — typowane params i searchParams
interface KampaniaPageProps {
  params: { id: string };
  searchParams: { tab?: string; scene?: string };
}

export default async function KampaniaPage({ params, searchParams }: KampaniaPageProps) {
  // ...
}
```

### Typowanie API route handlers

```ts
// ✅ Poprawnie — typowane request/response
import { NextRequest, NextResponse } from 'next/server';

interface UnlockRequestBody {
  knowledgeNodeId: string;
  characterId: string;
}

interface UnlockResponseBody {
  success: boolean;
  unlock: KnowledgeUnlockRow | null;
  error?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<UnlockResponseBody>> {
  // ...
}
```

### Zakaz `as` (z wyjątkiem type guards)

```ts
// ❌ ZABRONIONE
const scene = data as Scene;

// ✅ Dozwolone — wewnątrz type guard
function isScene(data: unknown): data is Scene {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'title' in data &&
    'status' in data
  );
}

// ✅ Dozwolone — const assertion
const ROLES = ['gm', 'player'] as const;
```

### Typowanie Zustand stores

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SessionStoreState {
  activeSceneId: string | null;
  activeLens: LensType;
  setActiveScene: (sceneId: string | null) => void;
  setActiveLens: (lens: LensType) => void;
}

export const useSessionStore = create<SessionStoreState>()(
  persist(
    (set) => ({
      activeSceneId: null,
      activeLens: 'session',
      setActiveScene: (sceneId) => set({ activeSceneId: sceneId }),
      setActiveLens: (lens) => set({ activeLens: lens }),
    }),
    { name: 'session-store' }
  )
);
```

---

## 7. Supabase — zasady krytyczne

**🚨 KRYTYCZNE:** Row Level Security (RLS) to kręgosłup bezpieczeństwa całego produktu. Asymetria wiedzy między MG a graczami opiera się WYŁĄCZNIE na politykach RLS. Jeśli RLS jest źle skonfigurowany, gracze widzą wiedzę, której nie powinni — i cały produkt traci sens.

### Klienty Supabase — kiedy którego używać

| Kontekst | Klient | Plik |
|---|---|---|
| Server Components | `createServerComponentClient` | `lib/supabase/server.ts` |
| API Routes | `createRouteHandlerClient` lub `admin` (z `service_role`) | `lib/supabase/server.ts` / `lib/supabase/admin.ts` |
| Middleware | `createMiddlewareClient` | `lib/supabase/middleware.ts` |
| Client Components (TYLKO real-time) | `createBrowserClient` | `lib/supabase/client.ts` |

**🚨 KRYTYCZNE:** Nigdy nie używaj klienta z `service_role` po stronie klienta. Service role omija RLS — to backdoor do wszystkich danych.

```ts
// src/lib/supabase/server.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/types/database.types';

export function createServerSupabase() {
  return createServerComponentClient<Database>({ cookies });
}
```

```ts
// src/lib/supabase/client.ts — TYLKO do real-time subscriptions
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/lib/types/database.types';

export function createBrowserSupabase() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### Polityki RLS — krytyczne, nienaruszalne

Poniższe polityki są RDZENIEM produktu. Cursor NIGDY nie może ich usunąć, osłabić ani obejść.

#### `knowledge_nodes` — SELECT tylko dla MG

```sql
-- Polityka: knowledge_nodes_select_gm
-- Tylko MG kampanii widzi węzły wiedzy.
-- Gracze NIE MAJĄ dostępu do tej tabeli — widzą wiedzę WYŁĄCZNIE przez knowledge_unlocks.
CREATE POLICY knowledge_nodes_select_gm ON knowledge_nodes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaign_members
      WHERE campaign_members.campaign_id = knowledge_nodes.campaign_id
        AND campaign_members.user_id = auth.uid()
        AND campaign_members.role = 'gm'
    )
  );
```

#### `knowledge_unlocks` — SELECT tylko dla właściciela postaci

```sql
-- Polityka: knowledge_unlocks_select_player
-- Gracz widzi TYLKO odblokowania dotyczące JEGO postaci.
-- MG widzi wszystkie odblokowania w swojej kampanii (osobna polityka).
CREATE POLICY knowledge_unlocks_select_player ON knowledge_unlocks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = knowledge_unlocks.character_id
        AND characters.player_id = auth.uid()
    )
  );
```

#### `npcs.hidden_notes` — nigdy dla nie-MG

```sql
-- Uwaga: hidden_notes nie jest filtrowane na poziomie RLS wiersza,
-- ale na poziomie SELECT w zapytaniach. NIGDY nie włączaj hidden_notes
-- w SELECT dla zapytań gracza.
--
-- W API routes i Server Components:
-- MG:    .select('id, name, description, hidden_notes, ...')
-- Gracz: .select('id, name, description, ...')  ← BEZ hidden_notes
```

**🚨 KRYTYCZNE:** Cursor NIGDY nie generuje zapytania z `hidden_notes` w kontekście gracza. Nawet jeśli RLS nie blokuje kolumny (bo blokuje wiersz), traktuj to jako zasadę defence-in-depth.

### Migracje — zasady

```bash
# Nazewnictwo migracji
supabase/migrations/20260404_initial_schema.sql
supabase/migrations/20260404_add_session_transcripts.sql
supabase/migrations/20260405_add_quest_status_enum.sql
```

**Workflow migracji:**

```bash
# 1. Napisz migrację
# 2. PRZECZYTAJ JĄ LINIA PO LINII
# 3. Sprawdź:
#    - Czy nie usuwa kolumn z danymi?
#    - Czy nie osłabia RLS?
#    - Czy CASCADE DELETE jest zamierzony?
#    - Czy ma komentarz wyjaśniający co zostanie utracone?
# 4. Dopiero wtedy:
supabase db push

# 5. Regeneruj typy:
supabase gen types typescript --local > src/lib/types/database.types.ts
```

**⚠️ WAŻNE:** Nigdy nie rób kaskadowego usuwania (`ON DELETE CASCADE`) bez komentarza w migracji wyjaśniającego, jakie dane zostaną utracone:

```sql
-- ⚠️ CASCADE: usunięcie kampanii usunie WSZYSTKIE sceny, postaci,
-- węzły wiedzy i odblokowania. To jest zamierzone — kampania jest
-- kontenerem nadrzędnym. Gracz straci historię.
ALTER TABLE scenes
  ADD CONSTRAINT fk_campaign
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
  ON DELETE CASCADE;
```

### Kluczowe tabele

| Tabela | Opis | RLS |
|---|---|---|
| `campaigns` | Kampanie | Członkowie kampanii |
| `campaign_members` | Relacja user↔kampania z rolą (gm/player) | Własne wpisy |
| `characters` | Postaci graczy | Własna postać + MG kampanii |
| `scenes` | Sceny w sesjach | Członkowie kampanii |
| `npcs` | NPC-e | Członkowie kampanii (ale `hidden_notes` tylko MG) |
| `npc_interactions` | Interakcje NPC ze scenami | Członkowie kampanii |
| `knowledge_nodes` | Węzły wiedzy | **Tylko MG** |
| `knowledge_unlocks` | Odblokowania per gracz | **Tylko właściciel postaci + MG** |
| `quests` | Questy | Członkowie kampanii |
| `session_captures` | Szybkie notatki z sesji | Członkowie kampanii |
| `session_transcripts` | Transkrypcje audio (v1.2) | Członkowie kampanii |

### Storage

```
Bucket: recordings (PRIVATE)
├── {campaign_id}/
│   └── {session_number}/
│       ├── chunk_0.webm
│       ├── chunk_1.webm
│       └── ...
```

**⚠️ WAŻNE:** Bucket `recordings` jest PRYWATNY. Dostęp tylko przez signed URLs generowane server-side. Nigdy nie generuj publicznych URL-i do nagrań.

### Regeneracja typów — obowiązkowa

Po KAŻDEJ zmianie schematu:

```bash
supabase gen types typescript --local > src/lib/types/database.types.ts
```

Cursor powinien automatycznie sugerować uruchomienie tej komendy po każdej migracji.

---

## 8. Komponenty — zasady

### Single Responsibility

Każdy komponent robi JEDNĄ rzecz. Jeśli komponent rośnie powyżej ~200 linii — rozbij go.

```
✅ SceneCard — wyświetla kartę sceny
✅ SceneList — wyświetla listę SceneCard
✅ SceneForm — formularz edycji sceny
❌ SceneManager — wyświetla listę, formularz, modal, filtrowanie (za dużo)
```

### Props interface — zawsze nad komponentem

```tsx
interface SceneCardProps {
  scena: SceneWithNPCs;
  isGM: boolean;
  onSelect: (sceneId: string) => void;
}

export function SceneCard({ scena, isGM, onSelect }: SceneCardProps) {
  // ...
}
```

### Stylowanie — bez inline styles

```tsx
// ❌ ZABRONIONE
<Box style={{ padding: 16, backgroundColor: '#f0f0f0' }}>

// ✅ Mantine sx prop
<Box sx={(theme) => ({ padding: theme.spacing.md, backgroundColor: theme.colors.gray[0] })}>

// ✅ CSS Modules
import classes from './scene-card.module.css';
<Box className={classes.root}>
```

### Mantine — nigdy bezpośrednio na stronach

```tsx
// ❌ ZABRONIONE — import Mantine w pliku page.tsx
import { Card, Badge, Button } from '@mantine/core';

export default function SesjaPage() {
  return <Card><Badge>Aktywna</Badge></Card>;
}

// ✅ Poprawnie — strona używa komponentu feature'owego
import { SceneList } from '@/components/features/sceny/scene-list';

export default async function SesjaPage({ params }: { params: { id: string } }) {
  const scenes = await fetchScenes(params.id);
  return <SceneList scenes={scenes} />;
}
```

### Server Components — domyślne

```tsx
// ✅ Server Component (domyślnie) — bez "use client"
export default async function SesjaPage() {
  const supabase = createServerSupabase();
  const { data: scenes } = await supabase.from('scenes').select('*');
  return <SceneList scenes={scenes} />;
}

// "use client" TYLKO gdy potrzebne:
// - Event handlery (onClick, onChange)
// - React hooks (useState, useEffect, useRef)
// - Zustand store
// - Subskrypcje real-time Supabase
```

### Rozdzielenie MG / Gracz

**🚨 KRYTYCZNE:** Nigdy nie mieszaj UI MG i gracza w jednym komponencie, jeśli różnice są znaczące.

```tsx
// Opcja A: Osobne pliki
// scene-card.gm.tsx — widok MG z hidden_notes, checkboxami unlock
// scene-card.player.tsx — widok gracza z odblokowaną wiedzą

// Opcja B: Jeden plik z isGM i early return (dla małych różnic)
export function SceneCard({ scena, isGM, onSelect }: SceneCardProps) {
  if (isGM) {
    return <SceneCardGM scena={scena} onSelect={onSelect} />;
  }
  return <SceneCardPlayer scena={scena} onSelect={onSelect} />;
}
```

**🚨 KRYTYCZNE:** Elementy GM-only (hidden_notes, checkboxy unlock) NIE MOGĄ istnieć w DOM-ie gracza. Nie ukrywaj `display: none` — nie renderuj wcale.

```tsx
// ❌ ZABRONIONE — element jest w DOM-ie, tylko ukryty
<Box display={isGM ? 'block' : 'none'}>
  <Text>{npc.hidden_notes}</Text>
</Box>

// ✅ Poprawnie — element nie istnieje w DOM-ie gracza
{isGM && (
  <Box>
    <Text>{npc.hidden_notes}</Text>
  </Box>
)}
```

### Lens Components — dane jako props

Komponenty Lens (SessionLens, MapLens, PlayerLens) NIGDY nie odpytują bazy bezpośrednio. Otrzymują dane jako props z Server Component strony.

```tsx
// ✅ Strona pobiera dane, Lens je wyświetla
// src/app/(app)/kampania/[id]/sesja/page.tsx
export default async function SesjaPage({ params }: Props) {
  const supabase = createServerSupabase();
  const { data: scenes } = await supabase.from('scenes').select('...');
  return <SessionLens scenes={scenes} />;
}

// src/components/features/sesja/session-lens.tsx
"use client";
export function SessionLens({ scenes }: SessionLensProps) {
  // logika UI, filtrowanie, Zustand — ale BEZ zapytań DB
}
```

### Quick Capture — offline/optimistic

```tsx
// Quick Capture musi działać nawet przy słabym połączeniu:
// 1. Zapis do Zustand store (natychmiastowy)
// 2. Sync do Supabase w tle
// 3. Retry przy braku połączenia
// 4. Wskaźnik statusu: "Zapisano" / "Synchronizowanie..." / "Offline — zapisano lokalnie"
```

---

## 9. Bezpieczeństwo i dostęp

### `isGM` — zawsze z serwera

**🚨 KRYTYCZNE:** Rola użytkownika MUSI być sprawdzana server-side na podstawie `campaign_members.role`.

```ts
// ✅ Poprawnie — server-side check
// W Server Component lub API Route:
const supabase = createServerSupabase();
const { data: member } = await supabase
  .from('campaign_members')
  .select('role')
  .eq('campaign_id', campaignId)
  .eq('user_id', userId)
  .single();

const isGM = member?.role === 'gm';

// ❌ ZABRONIONE — client-side claim
const isGM = localStorage.getItem('role') === 'gm';
const isGM = user.user_metadata.role === 'gm'; // metadata edytowalne
```

### Player Lens — nie renderuj GM-only

W widoku gracza, następujące dane NIGDY nie mogą być w DOM:
- `knowledge_nodes` bez odpowiadającego wpisu w `knowledge_unlocks`
- `npcs.hidden_notes`
- Checkboxy odblokowania wiedzy
- Lista wszystkich węzłów wiedzy kampanii
- Notatki MG w scenach

### Knowledge unlock — dedykowany endpoint

```
POST /api/campaigns/[id]/unlock
Body: { knowledgeNodeId: string, characterId: string }
```

Walidacja server-side:
1. Sprawdź, czy requestujący jest MG kampanii
2. Sprawdź, czy `knowledgeNodeId` należy do kampanii
3. Sprawdź, czy `characterId` należy do kampanii
4. Sprawdź, czy unlock nie istnieje już (idempotentność)
5. INSERT do `knowledge_unlocks`

**⚠️ WAŻNE:** Nigdy nie rób unlock bezpośrednio z klienta przez Supabase client. Zawsze przez API route.

### Auth middleware

```ts
// src/lib/supabase/middleware.ts
// Chroni WSZYSTKIE ścieżki (app)/*
// Redirect do /login jeśli brak sesji
// Odświeża token jeśli wygasły

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session && request.nextUrl.pathname.startsWith('/(app)')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return res;
}
```

### Zaproszenia

Zaproszenia do kampanii używają flow Supabase Auth invite. Nigdy nie generuj surowych tokenów zaproszenia ręcznie — zawsze korzystaj z `supabase.auth.admin.inviteUserByEmail()` lub Supabase magic links.

---

## 10. State management — Zustand

### Zasada: jeden store per domena

| Store | Odpowiedzialność |
|---|---|
| `useCampaignStore` | Aktywna kampania, lista kampanii |
| `useSessionStore` | Aktywna scena, aktywny lens, numer sesji |
| `useKnowledgeStore` | Stan UI wiedzy (otwarty modal, wybrany węzeł) |
| `useUIStore` | Stan nawigacji, sidebar, mobile |
| `useAudioStore` | v1.2 — MediaRecorder, chunked upload |

### Co idzie do Zustand, a co nie

| Typ stanu | Gdzie | Przykład |
|---|---|---|
| Efemeryczny stan UI | Zustand | Aktywna scena, otwarty modal, aktywny lens |
| Draft danych (Quick Capture) | Zustand (z persist) | Nieopublikowane notatki |
| Dane z bazy | React Query | Lista scen, węzły wiedzy, postaci |
| Real-time updates | Supabase subscriptions | Nowe odblokowania, zmiany scen |

**⚠️ WAŻNE:** Zustand NIE jest do cache'owania danych z bazy. Do tego służy React Query.

### Persist — localStorage

```ts
// Aktywna scena i lens muszą przetrwać odświeżenie strony
export const useSessionStore = create<SessionStoreState>()(
  persist(
    (set) => ({
      activeSceneId: null,
      activeLens: 'session' as LensType,
      setActiveScene: (sceneId) => set({ activeSceneId: sceneId }),
      setActiveLens: (lens) => set({ activeLens: lens }),
    }),
    {
      name: 'session-store',
      // Persist tylko wybrane pola — nie cały store
      partialize: (state) => ({
        activeSceneId: state.activeSceneId,
        activeLens: state.activeLens,
      }),
    }
  )
);
```

### useAudioStore — stub MVP

```ts
// src/store/use-audio-store.ts

import { create } from 'zustand';

// TODO(v1.2) — nagrywanie sesji
// Ten store obsługuje MediaRecorder i chunked upload do Supabase Storage.
// W MVP jest pustym stubem — nie implementuj.

interface AudioStoreState {
  isRecording: false;
  // TODO(v1.2) — dodaj: chunks, uploadProgress, transcriptStatus
}

export const useAudioStore = create<AudioStoreState>()(() => ({
  isRecording: false,
}));
```

---

## 11. Audio / Nagrywanie sesji — architektura przyszłościowa (v1.2)

### Co istnieje w MVP (stubs)

| Element | Stan w MVP | Lokalizacja |
|---|---|---|
| Folder `nagrywanie/` | Pusty z `.gitkeep` | `src/components/features/nagrywanie/` |
| `useAudioStore` | Stub z `isRecording: false` | `src/store/use-audio-store.ts` |
| Tabela `session_transcripts` | Utworzona w initial migration, pusta | `supabase/migrations/` |
| Kolumna `audio_url` w `session_captures` | Istnieje, nullable | Schema bazy |
| Kolumna `transcript_status` w `session_captures` | Istnieje, nullable | Schema bazy |
| Bucket `recordings` | Utworzony, prywatny | Supabase Storage |
| `OPENAI_WHISPER_API_KEY` | Pusty string w `.env.local` | Zmienne środowiskowe |

### Architektura docelowa (v1.2)

```
1. MediaRecorder API (przeglądarka) → chunk co 30s
2. Upload chunk → Supabase Storage: recordings/{campaign_id}/{session_number}/chunk_{n}.webm
3. Po zakończeniu nagrywania → wywołaj Supabase Edge Function
4. Edge Function → łączy chunki → wysyła do Whisper API
5. Whisper → transkrypcja → zapis do session_transcripts
6. Status update: transcript_status = 'completed'
```

**🚨 KRYTYCZNE:** Nigdy nie przetwarzaj audio po stronie klienta. Wszystkie wywołania Whisper API przechodzą przez Supabase Edge Function.

**⚠️ WAŻNE:** Signed URLs do nagrań mają czas życia max 1h. Nigdy nie cache'uj URL-i — generuj nowy przy każdym żądaniu.

---

## 12. Mobile — PWA i Capacitor

### Mantine AppShell — responsive

```tsx
<AppShell
  navbar={{
    width: 280,
    breakpoint: 'sm',
    collapsed: { mobile: !opened },
  }}
  header={{ height: 60 }}
>
  {/* ... */}
</AppShell>
```

### Player Lens na mobile

- Navbar ukryty (automatycznie przez AppShell breakpoint)
- Timeline na pełną szerokość
- TextInput (Quick Capture) sticky na górze ekranu
- Minimalne użycie modalów — preferuj drawer'y (lepsze na mobile)

### PWA setup — MVP

```json
// public/manifest.json
{
  "name": "Campaign Layer",
  "short_name": "CampaignLayer",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#1a1b1e",
  "theme_color": "#228be6",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- Zainstaluj `next-pwa` i skonfiguruj service worker w `next.config.js`
- Service worker cache'uje statyczne assety i offline fallback

### Breakpoints do testowania

| Urządzenie | Szerokość | Obowiązkowy test |
|---|---|---|
| iPhone SE | 375px | Tak — minimum |
| iPhone 14 | 390px | Tak |
| iPad | 768px | Tak |
| Desktop | 1280px+ | Tak |

**⚠️ WAŻNE:** Każdy nowy komponent MUSI być przetestowany na 375px i 768px przed commitem.

### Capacitor — v1.1

```ts
// capacitor.config.ts — utworzony przy setup projektu, NIEUŻYWANY w MVP
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.campaignlayer.app',
  appName: 'Campaign Layer',
  webDir: 'out',
  // TODO(v1.1) — konfiguracja Capacitor przy pierwszym buildzie mobile
};

export default config;
```

- `npx cap sync` TYLKO przy release mobile w v1.1
- Żadne natywne API w MVP — wszystko przez przeglądarkę

---

## 13. Testowanie

### Piramida testów

| Poziom | Narzędzie | Co testujemy | Kiedy |
|---|---|---|---|
| Unit | Vitest | Utility functions, hooks, helpery | Każdy commit |
| Komponent | React Testing Library | Kluczowe komponenty UI | Każdy commit |
| Integracja | Supabase test helpers | Polityki RLS | Po zmianach migracji |
| E2E | Playwright | Krytyczne ścieżki użytkownika | Przed merge do main |

### Zasada: test PRZED implementacją

```bash
# 1. Napisz test
touch src/components/features/sceny/scene-card.test.tsx
# → Napisz testy opisujące oczekiwane zachowanie

# 2. Uruchom test — MUSI FAILOWAĆ (red phase)
npm run test -- scene-card

# 3. Zaimplementuj komponent
touch src/components/features/sceny/scene-card.tsx
# → Implementacja aż testy przejdą (green phase)

# 4. Refaktor (jeśli potrzebne)
```

### Konwencja nazewnictwa testów

```ts
describe('SceneCard', () => {
  it('wyświetla badge "improwizowana" dla statusu improvised', () => { ... });
  it('nie renderuje hidden_notes gdy isGM = false', () => { ... });
  it('wywołuje onSelect po kliknięciu', () => { ... });
});

describe('useKnowledgeUnlock', () => {
  it('wysyła POST do /api/campaigns/[id]/unlock', () => { ... });
  it('invaliduje cache React Query po udanym unlock', () => { ... });
  it('zwraca error gdy użytkownik nie jest MG', () => { ... });
});
```

### Testy RLS — obowiązkowe

**🚨 KRYTYCZNE:** Każda polityka RLS MUSI mieć test integracyjny.

```ts
describe('RLS: knowledge_nodes', () => {
  it('MG widzi wszystkie węzły wiedzy kampanii', async () => { ... });
  it('Gracz NIE widzi żadnych węzłów wiedzy', async () => { ... });
});

describe('RLS: knowledge_unlocks', () => {
  it('Gracz widzi TYLKO odblokowania swojej postaci', async () => { ... });
  it('Gracz NIE widzi odblokowań innej postaci', async () => { ... });
  it('MG widzi wszystkie odblokowania kampanii', async () => { ... });
});
```

### Nigdy nie commituj z failującymi testami

```bash
# Pre-commit hook (husky):
npm run test -- --run
npx tsc --noEmit
```

---

## 14. Git — workflow i konwencje

### Nazewnictwo branchy

```
feature/wiedza-unlock-modal
feature/sesja-quick-capture
feature/gracz-timeline
feature/mapa-react-flow          # v1.1
fix/sceny-filtrowanie-status
fix/rls-knowledge-nodes
chore/db-migracja-transcripts
refactor/auth-middleware
```

Format: `{typ}/{domena}-{krótki-opis}`

### Conventional Commits — po polsku

```
feat(wiedza): dodaj modal odblokowania wiedzy
feat(sesja): implementuj Quick Capture z offline sync
feat(gracz): dodaj Player Lens timeline
fix(sceny): napraw filtrowanie po statusie
fix(rls): popraw politykę knowledge_unlocks
chore(db): migracja tabeli session_transcripts
chore(deps): aktualizacja Mantine do 7.x
refactor(auth): wydziel middleware Supabase
test(wiedza): dodaj testy RLS dla knowledge_nodes
docs: aktualizuj README z instrukcją setup
```

### Zasady Git

| Zasada | Dlaczego |
|---|---|
| Nigdy nie commituj bezpośrednio do `main` | Nawet solo — zawsze PR. Historia jest czystsza. |
| Po każdej sesji Cursora: `git diff` | Weryfikuj zmiany przed commitem |
| PR description: co, dlaczego, jak testowano | Dokumentacja dla przyszłego siebie |
| `.env.local` NIGDY w git | Secrets w `.env.example` z pustymi wartościami |
| Squash merge do main | Czysty log commitów |

### .env.example

```bash
# Committed to git — puste wartości jako szablon
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_WHISPER_API_KEY=
NEXT_PUBLIC_APP_URL=
```

### .gitignore — krytyczne wpisy

```
.env.local
.env.*.local
node_modules/
.next/
out/
supabase/.temp/
```

---

## 15. Zasady dla Cursora — meta-reguły

Poniższe zasady to bezwzględne reguły, których Cursor MUSI przestrzegać generując kod dla Campaign Layer.

### Bezpieczeństwo wiedzy

**🚨 KRYTYCZNE:**

1. **NIGDY nie generuj kodu wysyłającego `knowledge_nodes` do gracza bez sprawdzenia `knowledge_unlocks`.**
   Każdy widok gracza musi przejść przez `knowledge_unlocks` JOIN. Gracz nie ma bezpośredniego dostępu do `knowledge_nodes`.

2. **NIGDY nie używaj `select *` na tabelach z RLS.**
   Zawsze specyfikuj kolumny jawnie. `select *` może przypadkowo ujawnić `hidden_notes` lub inne pola GM-only.

3. **Gdy nie jesteś pewien polityki RLS — ZAPYTAJ zamiast zgadywać.**
   Bezpieczeństwo asymetrii wiedzy to rdzeń produktu. Lepiej zapytać niż wygenerować lukę bezpieczeństwa.

### Zapytania do bazy

4. **NIGDY nie generuj inline SQL strings.**
   Zawsze używaj Supabase query builder lub typed RPC calls.

   ```ts
   // ❌ ZABRONIONE
   const { data } = await supabase.rpc('raw_query', { sql: 'SELECT * FROM scenes' });

   // ✅ Poprawnie
   const { data } = await supabase
     .from('scenes')
     .select('id, title, status, scene_number')
     .eq('campaign_id', campaignId);
   ```

5. **Każde nowe zapytanie Supabase — komentarz o polityce RLS.**

   ```ts
   // RLS: scenes widoczne dla wszystkich członków kampanii
   // Polityka: scenes_select_members
   const { data: scenes } = await supabase
     .from('scenes')
     .select('id, title, status')
     .eq('campaign_id', campaignId);
   ```

### Architektura komponentów

6. **NIGDY nie dodawaj logiki stanu UI do Server Components.**
   Wydziel do osobnego client component.

7. **ZAWSZE dodawaj `// TODO(v1.1)` lub `// TODO(v1.2)` zamiast implementować przyszłe feature'y.**
   MVP to Session Lens + Player Lens. Nic więcej.

8. **Nigdy nie generuj więcej niż ~300 linii w jednym pliku.**
   Jeśli komponent rośnie — rozbij na mniejsze moduły.

### Nazewnictwo

9. **Polskie nazwy zmiennych dla pojęć domenowych, angielskie dla techniki.**

   ```ts
   // ✅ Poprawnie
   const kampania = await fetchCampaign(id);
   const aktywnaScena = useSessionStore(s => s.activeSceneId);
   const isGM = member.role === 'gm';

   // ✅ Technika — angielski
   function handleSceneSelect(sceneId: string) { ... }
   const store = useSessionStore();
   ```

### Nowe feature'y

10. **Przed dodaniem feature'a: „Czy potrzebuję nowej tabeli?"**
    Jeśli tak — napisz migrację NAJPIERW, przejrzyj ją, uruchom, regeneruj typy. Dopiero potem implementuj komponent.

### Mantine

11. **Preferuj komponenty Mantine nad customowy HTML.**
    Nigdy nie odtwarzaj tego, co Mantine już oferuje. `Button`, `Modal`, `Card`, `Badge`, `Timeline`, `Tabs` — używaj ich.

    ```tsx
    // ❌ ZABRONIONE
    <div className="custom-card">
      <span className="badge">Aktywna</span>
    </div>

    // ✅ Poprawnie
    <Card>
      <Badge>Aktywna</Badge>
    </Card>
    ```

### Podsumowanie meta-reguł

| # | Reguła | Priorytet |
|---|---|---|
| 1 | Nie wysyłaj knowledge_nodes graczowi bez unlock | 🚨 KRYTYCZNY |
| 2 | Nie używaj `select *` na tabelach z RLS | 🚨 KRYTYCZNY |
| 3 | Zapytaj o RLS zamiast zgadywać | 🚨 KRYTYCZNY |
| 4 | Nie generuj inline SQL | ⚠️ WAŻNE |
| 5 | Komentuj politykę RLS przy każdym zapytaniu | ⚠️ WAŻNE |
| 6 | Nie dodawaj stanu UI do Server Components | ⚠️ WAŻNE |
| 7 | TODO z wersją, nie implementuj przyszłości | ⚠️ WAŻNE |
| 8 | Max ~300 linii per plik | ⚠️ WAŻNE |
| 9 | Polskie nazwy domenowe, angielska technika | INFO |
| 10 | Migracja przed implementacją | ⚠️ WAŻNE |
| 11 | Mantine nad customowym HTML | INFO |

---

## 16. Środowisko i setup

### Zmienne środowiskowe (.env.local)

```bash
# Supabase — obowiązkowe
NEXT_PUBLIC_SUPABASE_URL=         # URL projektu Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Klucz publiczny (anon) — bezpieczny w kliencie
SUPABASE_SERVICE_ROLE_KEY=        # Klucz service role — TYLKO server-side, NIGDY w kliencie

# OpenAI
OPENAI_API_KEY=                   # GPT-4o — v1.1 sugestie AI
OPENAI_WHISPER_API_KEY=           # Whisper API — puste w MVP, v1.2

# App
NEXT_PUBLIC_APP_URL=              # URL aplikacji (http://localhost:3000 lokalnie)
```

**🚨 KRYTYCZNE:** `SUPABASE_SERVICE_ROLE_KEY` nigdy nie może być zmienna `NEXT_PUBLIC_`. Omija RLS.

### Migracje — w repozytorium

```
supabase/migrations/
├── 20260404_initial_schema.sql          — kampanie, członkowie, postacie, sceny, NPC-e
├── 20260404_rls_policies.sql            — WSZYSTKIE polityki RLS
├── 20260404_knowledge_nodes.sql         — węzły wiedzy, odblokowania
├── 20260404_session_captures.sql        — Quick Capture, audio stubs
└── 20260404_add_session_transcripts.sql — transkrypcje (v1.2 stub)
```

Wszystkie migracje MUSZĄ być commitowane do gita. Nigdy nie polegaj na Supabase Dashboard do zmian schematu.

### Lokalne środowisko deweloperskie

```bash
# 1. Uruchom Supabase lokalnie
supabase start

# 2. Zaaplikuj migracje
supabase db push

# 3. Wygeneruj typy
supabase gen types typescript --local > src/lib/types/database.types.ts

# 4. Uruchom dev server
npm run dev

# 5. (Opcjonalnie) Seed danych testowych
supabase db seed
```

### Rekomendowane rozszerzenia (Cursor / VS Code)

- **ESLint** — linting TypeScript i React
- **Prettier** — formatowanie kodu
- **Supabase** — podpowiedzi SQL, podgląd schematu
- **Error Lens** — inline wyświetlanie błędów TS

---

## Checklist przed commitem

Cursor (i developer) powinien przejść przez tę listę przed KAŻDYM commitem:

```
□ Testy przechodzą: npm run test -- --run
□ TypeScript kompiluje się: npx tsc --noEmit
□ Brak `any` w nowym kodzie: grep -rn ": any\|as any" src/ --include="*.ts" --include="*.tsx"
□ Brak `select *` w zapytaniach Supabase
□ Każde zapytanie RLS-sensitive ma komentarz bezpieczeństwa
□ Elementy GM-only nie renderują się w DOM gracza (conditional render, nie CSS hide)
□ Nowe komponenty przetestowane na 375px i 768px
□ Brak zakomentowanego kodu (usunięty lub feature flag)
□ Wszystkie TODO mają wersję: TODO(v1.1) lub TODO(v1.2)
□ Nowe eksporty mają JSDoc
□ git diff — przejrzane WSZYSTKIE zmiany
□ Commit message w formacie Conventional Commits PL
□ .env.local NIE jest staged: git status
□ Jeśli zmieniono schemat: supabase gen types typescript zaktualizowane
□ Jeśli dodano migrację: SQL przeczytany linia po linii
```

---

> **Ten dokument jest żywą referencją.** Aktualizuj go przy każdej zmianie architektury, nowej konwencji lub lekcji wyciągniętej z bug'a bezpieczeństwa. Cursor powinien traktować go jako źródło prawdy o projekcie Campaign Layer.
