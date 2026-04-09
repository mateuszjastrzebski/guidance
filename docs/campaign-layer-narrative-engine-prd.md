# PRD — Campaign Layer: Narrative Engine

### Product Requirements Document · v0.1 · kwiecień 2026

---

```
Dokument:   Campaign Layer — Narrative Engine PRD
Wersja:     v0.1
Data:       2026-04-06
Autor:      Campaign Layer (solo)
Referencja: campaign-layer-prd.pplx.md
```

---

## Streszczenie

Ten dokument opisuje system **Narrative Engine** — warstwę narzędzi narracyjnych dla Campaign Layer, która pomaga Mistrzowi Gry (MG) strukturyzować wątki fabularne za pomocą szablonów, archetypów i mechanicznego wykrywania luk. Narrative Engine **nie wymaga AI** — działa w pełni na szablonach i regułach. AI (v1.1+) personalizuje sugestie, ale nigdy nie jest jedyną ścieżką do wyniku. Dokument jest samodzielnym uzupełnieniem głównego PRD (`campaign-layer-prd.pplx.md`) i nie duplikuje jego treści — odwołuje się do istniejącego modelu danych (kampanie, sceny, NPC, eventy) i rozszerza go o struktury narracyjne.

---

## 2. Problem i cel

### Problem

Najtrudniejszą częścią prowadzenia kampanii TTRPG jest **struktura narracyjna** — umiejętność połączenia wydarzenia początkowego z końcowym w sposób, który czuje się nieunikniony i satysfakcjonujący. Większość MG wpada w jedną z trzech kategorii:

1. **Wiedzą, jak to robić intuicyjnie** — narzędzie nie jest im do tego potrzebne.
2. **Nie wiedzą i improwizują chaotycznie** — narzędzie wypełnia lukę.
3. **Znają teorię, ale zapominają ją stosować** podczas przygotowywania sesji — narzędzie przypomina i pokazuje braki.

Kategorie 2 i 3 to nasz główny target. Wspólny problem: MG nie widzi struktury swojej historii w jednym miejscu. Wątki grzęzną, NPC nie pełnią wyrazistych ról, setup nie ma payoffu, a niektóre postacie graczy nie dostają czasu w centrum uwagi tygodniami.

### Cel

**Campaign Layer pokazuje strukturalne luki w wątkach narracyjnych bez wymagania AI.** Szablony i archetypy dostarczają rusztowanie. AI (v1.1+) personalizuje to rusztowanie do konkretnej kampanii.

### Kluczowa zasada

**🚨 KRYTYCZNE:** Narzędzie dostarcza wartość przez **strukturę i widoczność**, nie przez AI. AI przyspiesza i sugeruje — nigdy nie jest jedyną drogą do wyniku.

---

## 3. Koncepty kluczowe — słownik

| Termin | Definicja |
|--------|-----------|
| **Narrative Template** (Szablon narracyjny) | Predefiniowana sekwencja oczekiwanych beatów fabularnych, przypisywana do wątku. Przykłady: Podróż Bohatera, Łuk Tajemnicy, Struktura 3-aktowa. MG przypisuje szablon do wątku — narzędzie pokazuje, które beaty są wypełnione (mają event), a które puste (luki). |
| **Beat** | Konkretny moment narracyjny oczekiwany przez szablon. Np. w Podróży Bohatera: „Wezwanie do przygody", „Spotkanie z Mentorem", „Próba". Beat jest wypełniony, gdy przypisano do niego event. |
| **Event** | Zmiana stanu świata lub zdarzenie w świecie kampanii. Może nastąpić podczas sceny lub być omawiane w scenie. Event może wypełnić beat w szablonie. **Event ≠ Scena** — scena to moment gry od strony gracza; event to fakt w świecie gry. |
| **Wątek (Thread)** | Linia fabularna kampanii. Ma opcjonalnie jeden szablon. Zawiera wiele eventów. Przykłady: „Wojna frakcji", „Odkupienie Aldrica", „Tajemnica zatrutego ostrza". |
| **NPC Archetype** (Archetyp NPC) | Jungiańska/narracyjna rola NPC: Mentor, Cień, Trickster, Herold, Zmiennokształtny, Strażnik Progu, Sojusznik, Antagonista. Jeden NPC może mieć różne archetypy w różnych wątkach. |
| **Chekhov's Gun** (Pistolet Czechowa) | Event oznaczony jako `setup` wymaga odpowiadającego mu eventu `payoff`. Narzędzie śledzi nierozwiązane setupy. |
| **Spotlight** | Każda postać gracza powinna mieć osobisty moment narracyjny co N sesji. Narzędzie śledzi, które postacie dawno nie miały czasu w centrum uwagi. |
| **Narrative Gap** (Luka narracyjna) | Dowolny problem strukturalny wykryty mechanicznie: niewypełnione beaty, brakujące archetypy, nierozwiązane setupy Czechowa, postacie bez spotlight, wątki bez eventów połączonych z głównym łukiem. |

---

## 4. Zasady projektowe (Design Principles)

### 1. Struktura bez przymusu

Szablony to sugestie, nigdy ograniczenia. MG może ignorować beaty, pomijać archetypy, zostawiać luki celowo. Narzędzie **pokazuje, nigdy nie blokuje**.

### 2. Działa bez AI

Każda funkcjonalność musi być w pełni operacyjna bez AI. AI personalizuje i przyspiesza — nigdy nie bramkuje dostępu do funkcji.

### 3. Addytywność wobec istniejących danych

System dodaje opcjonalne metadane do istniejących encji (eventy, wątki, NPC). **Nigdy nie zmienia sposobu działania encji bazowych** zdefiniowanych w głównym PRD.

### 4. Edukacja przez użycie

Narzędzie uczy rzemiosła narracyjnego przez codzienne użycie. Hover na „Wezwanie do przygody" → krótkie wyjaśnienie co to znaczy + przykład z TTRPG. MG uczą się storytellingu przygotowując swoje kampanie.

### 5. Progressive disclosure

MG nie musi używać szablonów w ogóle. System jest niewidoczny jeśli nie zostanie aktywowany. Panel luk narracyjnych jest opcjonalny — można go zamknąć, ukryć, nigdy nie otworzyć.

### 6. Zawsze MG decyduje

Narzędzie nigdy nie tworzy eventów ani nie modyfikuje narracji automatycznie. Każda sugestia wymaga **jawnej akcji MG** — kliknięcia, zatwierdzenia, wybrania.

---

## 5. User Stories

### MG — Planowanie kampanii (pre-session)

```
Jako MG chcę przypisać szablon Podróży Bohatera do osobistego łuku postaci,
żeby widzieć które beaty narracyjne nie zostały jeszcze pokryte.

Jako MG chcę na jeden rzut oka zobaczyć które z moich wątków mają luki
strukturalne, żeby wiedzieć co przygotować przed następną sesją.

Jako MG chcę oznaczyć NPC jako „Mentora" w konkretnym wątku, żeby
narzędzie mogło mi powiedzieć czy wątek nie ma brakujących archetypów.

Jako MG chcę oznaczyć event jako „setup" (Pistolet Czechowa) i powiązać
go z przyszłym eventem payoff, żeby narzędzie przypominało mi o
nierozwiązanych setupach.

Jako MG chcę zobaczyć które postacie graczy nie miały momentu spotlight
od 3+ sesji, żeby zaplanować beat skupiony na tej postaci.
```

### MG — Po sesji (post-session)

```
Jako MG chcę szybko przypisać beaty do eventów które zarejestrowałem
podczas sesji, żeby zaktualizować postęp wątków.

Jako MG chcę zobaczyć które wątki posunęły się naprzód w tej sesji,
a które stagnują, żeby ocenić tempo narracji.
```

### MG — z AI (v1.1+)

```
Jako MG z niewypełnionym beatem „Mentor" chcę, żeby narzędzie
zasugerowało który istniejący NPC w mojej kampanii najlepiej pasuje
do tej roli, na podstawie jego historii.

Jako MG chcę, żeby AI zaproponowało 3 opcje eventów dla pustego beatu,
uwzględniając istniejące postacie, lokacje i wątki mojej kampanii.
```

---

## 6. Funkcjonalności — wersje

### MVP (v1.0) — Mechanika bez AI

#### 1. Template Library (Biblioteka szablonów)

Wbudowane szablony: Podróż Bohatera (12 beatów), Struktura 3-aktowa (6), Łuk Tajemnicy (7), Łuk Tragedii (6), Łuk Odkupienia (6), Łuk Zemsty (5). Każdy beat zawiera: `id`, `name` (EN), `name_pl` (PL), `description_pl`, `beat_order`, `is_optional`, 2–3 generyczne przykłady TTRPG (niepersolalizowane).

**⚠️ WAŻNE:** W v1.0 MG nie może tworzyć własnych szablonów. Tylko wbudowane. Tworzenie własnych → v1.1.

#### 2. Thread Template Assignment (Przypisanie szablonu do wątku)

MG może przypisać szablon do dowolnego wątku. Jeden wątek = jeden szablon (lub żaden). Szablon wyświetlany jako wizualny beat tracker w widoku szczegółów wątku.

#### 3. Beat Tracker UI

Wizualny pasek beatów dla wątku. Każdy beat wyświetla status:
- **Wypełniony** (ma event) → zielony, wypełniona ikona
- **Pusty** (brak eventu) → kontur, domyślny kolor
- **Opcjonalny-pusty** → szary kontur

Kliknięcie na wypełniony beat → widok powiązanego eventu. Kliknięcie na pusty beat → opcja szybkiego tworzenia eventu.

#### 4. Event → Beat Assignment

Podczas tworzenia lub edycji eventu MG może opcjonalnie przypisać go do beatu w szablonie wątku. Jeden event może wypełniać beaty w wielu szablonach (jeśli wątki współdzielą ten event).

#### 5. NPC Archetype Tagging

Na profilu NPC, MG może przypisać 1+ archetypów per wątek. Archetypy: Mentor, Cień (Shadow), Trickster, Herold (Herald), Zmiennokształtny (Shapeshifter), Strażnik Progu (Threshold Guardian), Sojusznik (Ally), Antagonista. Widok szablonu wątku pokazuje które archetypy są obecne, a które brakują.

#### 6. Narrative Gaps Panel (Panel luk narracyjnych)

Dedykowany panel (sidebar lub strona) wyświetlający wszystkie wykryte luki w kampanii:
- Niewypełnione obowiązkowe beaty
- Wątki bez kluczowych archetypów
- Setupy Czechowa bez payoffu
- Postacie bez spotlight od 5+ sesji

Każda luka to link do odpowiedniej encji.

#### 7. Chekhov's Gun Tracking

Event może być oznaczony `is_setup: true` z opcjonalnym opisem. Opcjonalnie powiązany z eventem payoff. Panel luk pokazuje wszystkie nierozwiązane setupy.

#### 8. Spotlight Tracker

Śledzi sesje per postać. Konfigurowalny próg (domyślnie: 3 sesje). Pokazuje postacie zbliżające się do lub przekraczające próg.

---

### v1.1 — AI Personalization

#### 1. AI Archetype Suggestion

Dla niewypełnionego slotu archetypu (np. brakujący Mentor) AI skanuje istniejące NPC i sugeruje najlepsze dopasowanie z wyjaśnieniem: _„Aldric starszy pojawił się w sesjach 1 i 4, głównie jako postać dzieląca się wiedzą — pasuje do archetypu Mentora w tym wątku."_

#### 2. AI Beat Event Suggestion

Dla pustego beatu AI generuje 3 propozycje eventów, które pasują do typu beatu ORAZ odwołują się do istniejących postaci, lokacji i wątków kampanii. MG wybiera jedną lub ignoruje.

#### 3. AI Gap Explanation

Dla każdej wykrytej luki AI podaje krótkie kontekstowe wyjaśnienie, dlaczego ta luka ma znaczenie narracyjne: nie tylko „brakuje beatu", ale _„bez beatu Strażnika Progu przejście bohatera do drugiego aktu będzie odczuwane jako niezasłużone"_.

#### 4. AI Thread Connection

Dla dwóch wątków bez wspólnych eventów lub postaci AI sugeruje event łączący, który naturalnie powiąże oba wątki.

---

### v1.2 — Deep AI (wymaga transkrypcji sesji)

#### 1. Post-Session Beat Auto-Detection

Po transkrypcji Whisper AI sugeruje, które beaty z aktywnych szablonów zostały wypełnione podczas sesji. MG zatwierdza lub odrzuca.

#### 2. Narrative Coherence Check

AI przegląda pełny graf eventów i flaguje potencjalne dziury fabularne, sprzeczności lub nierozwiązane foreshadowing w całej kampanii.

---

## 7. Model danych

**⚠️ WAŻNE:** Poniższy schemat rozszerza model danych z głównego PRD (`campaign-layer-prd.pplx.md`). Tabele `campaigns`, `characters`, `npcs`, `events` i `campaign_members` są zdefiniowane tam. Tutaj definiujemy wyłącznie nowe tabele i migracje.

### Nowe tabele

```sql
-- ============================================================
-- Predefiniowane szablony narracyjne (seeded, nie tworzone przez użytkownika w v1.0)
-- Zawierają wbudowane łuki fabularne: Podróż Bohatera, Tajemnica, itd.
-- ============================================================
CREATE TABLE narrative_templates (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,                    -- "Hero's Journey"
  name_pl       text NOT NULL,                    -- "Podróż Bohatera"
  description_pl text,                            -- opis szablonu po polsku
  type          text NOT NULL,                    -- 'hero_journey' | 'mystery' | 'three_act' | 'tragedy' | 'redemption' | 'revenge'
  is_builtin    boolean DEFAULT true,             -- szablony wbudowane vs. custom (v1.1)
  created_at    timestamptz DEFAULT now()
);

-- ============================================================
-- Beaty wewnątrz szablonu (seeded razem z szablonem)
-- Każdy beat to oczekiwany moment narracyjny w łuku fabularnym.
-- ============================================================
CREATE TABLE narrative_beats (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id   uuid NOT NULL REFERENCES narrative_templates(id) ON DELETE CASCADE,
  name          text NOT NULL,                    -- "Call to Adventure"
  name_pl       text NOT NULL,                    -- "Wezwanie do przygody"
  description_pl text NOT NULL,                   -- co oznacza ten beat + krótki opis
  example_pl    text,                             -- konkretny przykład dla kontekstu TTRPG
  beat_order    integer NOT NULL,                 -- kolejność w szablonie (1, 2, 3...)
  is_optional   boolean DEFAULT false,            -- opcjonalne beaty nie generują luk
  archetype_hint text                             -- np. 'mentor' dla beatu "Spotkanie z Mentorem"
);

-- ============================================================
-- Przypisanie szablonu do wątku (junction table)
-- Jeden wątek ma maksymalnie jeden aktywny szablon.
-- ============================================================
CREATE TABLE thread_narrative_templates (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id     uuid NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  template_id   uuid NOT NULL REFERENCES narrative_templates(id) ON DELETE RESTRICT,
  assigned_at   timestamptz DEFAULT now(),
  assigned_by   uuid NOT NULL REFERENCES auth.users(id),  -- zawsze MG
  UNIQUE (thread_id)                              -- max 1 szablon per wątek
);

-- ============================================================
-- Przypisanie eventu do beatu w kontekście wątku
-- Jeden event może wypełniać beaty w wielu wątkach.
-- ============================================================
CREATE TABLE event_beat_assignments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  beat_id       uuid NOT NULL REFERENCES narrative_beats(id) ON DELETE CASCADE,
  thread_id     uuid NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  assigned_at   timestamptz DEFAULT now(),
  assigned_by   uuid NOT NULL REFERENCES auth.users(id),
  UNIQUE (beat_id, thread_id)                     -- jeden beat per wątek wypełniony max 1 eventem
);

-- ============================================================
-- Tagi archetypowe NPC per wątek
-- NPC może pełnić różne role narracyjne w różnych wątkach.
-- ============================================================
CREATE TABLE npc_archetype_tags (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  npc_id        uuid NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
  thread_id     uuid NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  archetype     text NOT NULL CHECK (archetype IN (
                  'mentor', 'shadow', 'trickster', 'herald',
                  'shapeshifter', 'threshold_guardian', 'ally', 'antagonist'
                )),
  notes         text,                             -- opcjonalny komentarz MG
  tagged_at     timestamptz DEFAULT now(),
  UNIQUE (npc_id, thread_id, archetype)           -- NPC ma dany archetyp w wątku max raz
);

-- ============================================================
-- Śledzenie Chekhov's Gun — pary setup/payoff
-- Setup to event zasiewający wątek, payoff to jego rozwiązanie.
-- ============================================================
CREATE TABLE chekhov_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  setup_event_id  uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  payoff_event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  description_pl  text,                           -- "Zatruty sztylet wspomniany przez kapłana"
  is_resolved     boolean DEFAULT false,
  resolved_at     timestamptz,
  created_at      timestamptz DEFAULT now()
);

-- ============================================================
-- Spotlight tracking — śledzenie momentów osobistych per postać per sesja
-- Pozwala MG zobaczyć kto dawno nie miał czasu w centrum uwagi.
-- ============================================================
CREATE TABLE character_spotlight_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id    uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  campaign_id     uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  session_number  integer NOT NULL,
  had_personal_beat boolean DEFAULT false,
  notes           text,                           -- opcjonalny opis momentu spotlight
  logged_at       timestamptz DEFAULT now(),
  UNIQUE (character_id, session_number)           -- jeden wpis per postać per sesja
);
```

### Migracje istniejących tabel

```sql
-- Dodatkowe kolumny w istniejącej tabeli events:
ALTER TABLE events
  ADD COLUMN is_chekhov_setup boolean DEFAULT false,
  ADD COLUMN beat_hint text;                      -- luźna notatka MG o typie beatu
```

### Tabela threads (jeśli nie zdefiniowana w głównym PRD)

```sql
-- ============================================================
-- Wątki fabularne kampanii (Narrative Threads)
-- Linie fabularne takie jak "Wojna frakcji" czy "Odkupienie Aldrica".
-- ============================================================
CREATE TABLE threads (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name          text NOT NULL,
  description   text,
  status        text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'suspended')),
  thread_type   text CHECK (thread_type IN ('main', 'personal', 'faction', 'side')),
  created_by    uuid NOT NULL REFERENCES auth.users(id),
  created_at    timestamptz DEFAULT now()
);
```

### Row Level Security (RLS)

```sql
-- =========================
-- RLS: narrative_templates
-- =========================
-- SELECT: wszyscy członkowie kampanii (gracze widzą nazwy szablonów)
-- INSERT/UPDATE/DELETE: brak (szablony wbudowane, seed only)

-- =========================
-- RLS: narrative_beats
-- =========================
-- SELECT: wszyscy członkowie kampanii
-- INSERT/UPDATE/DELETE: brak (beaty wbudowane, seed only)

-- =========================
-- RLS: thread_narrative_templates
-- =========================
-- SELECT/INSERT/UPDATE/DELETE: tylko członkowie kampanii z role = 'gm'
ALTER TABLE thread_narrative_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gm_only_thread_templates"
  ON thread_narrative_templates
  USING (
    EXISTS (
      SELECT 1 FROM threads t
      JOIN campaign_members cm ON cm.campaign_id = t.campaign_id
      WHERE t.id = thread_narrative_templates.thread_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'gm'
    )
  );

-- =========================
-- RLS: event_beat_assignments
-- =========================
-- SELECT/INSERT/UPDATE/DELETE: tylko MG
ALTER TABLE event_beat_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gm_only_event_beats"
  ON event_beat_assignments
  USING (
    EXISTS (
      SELECT 1 FROM threads t
      JOIN campaign_members cm ON cm.campaign_id = t.campaign_id
      WHERE t.id = event_beat_assignments.thread_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'gm'
    )
  );

-- =========================
-- RLS: npc_archetype_tags
-- =========================
-- SELECT/INSERT/UPDATE/DELETE: tylko MG
ALTER TABLE npc_archetype_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gm_only_archetype_tags"
  ON npc_archetype_tags
  USING (
    EXISTS (
      SELECT 1 FROM threads t
      JOIN campaign_members cm ON cm.campaign_id = t.campaign_id
      WHERE t.id = npc_archetype_tags.thread_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'gm'
    )
  );

-- =========================
-- RLS: chekhov_items
-- =========================
-- SELECT/INSERT/UPDATE/DELETE: tylko MG
ALTER TABLE chekhov_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gm_only_chekhov"
  ON chekhov_items
  USING (
    EXISTS (
      SELECT 1 FROM campaign_members cm
      WHERE cm.campaign_id = chekhov_items.campaign_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'gm'
    )
  );

-- =========================
-- RLS: character_spotlight_log
-- =========================
-- INSERT/UPDATE/DELETE: tylko MG
-- SELECT: MG + gracz którego postać dotyczy
ALTER TABLE character_spotlight_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gm_and_owner_spotlight"
  ON character_spotlight_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaign_members cm
      WHERE cm.campaign_id = character_spotlight_log.campaign_id
        AND cm.user_id = auth.uid()
        AND (cm.role = 'gm' OR cm.character_id = character_spotlight_log.character_id)
    )
  );
CREATE POLICY "gm_only_spotlight_write"
  ON character_spotlight_log
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM campaign_members cm
      WHERE cm.campaign_id = character_spotlight_log.campaign_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'gm'
    )
  );
```

---

## 8. Architektura UI — Mantine

### 8.1 Beat Tracker (widok szczegółów wątku)

```
Stack
├── Group (justify="space-between")
│   ├── Text (weight=700, nazwa wątku)
│   └── Badge (variant="light", color="blue", nazwa szablonu: "Podróż Bohatera")
├── ScrollArea (horizontal scroll na mobile)
│   └── Group (gap="xs", nowrap) — Beat Strip
│       └── Tooltip (label=beat description_pl) × N beatów
│           └── ThemeIcon
│               variant: filled (green) | outline (default) | light (gray=opcjonalny)
│               icon: IconCheck | IconCircleDashed | IconCircleMinus
├── Divider (my="md")
└── SimpleGrid (cols={3} na desktop, cols={1} na mobile)
    └── Card (withBorder, shadow="xs") × N beatów — widok rozwinięty
        ├── Group
        │   ├── Badge (size="sm", beat name_pl)
        │   └── Badge (size="xs", color="gray", "opcjonalny") — warunkowo
        ├── Text (size="sm", c="dimmed", description_pl)
        ├── Text (size="xs", c="dimmed", example_pl) — tooltip lub collapse
        └── JEŚLI wypełniony:
        │   NavLink (label=nazwa eventu, href → event detail)
            JEŚLI pusty:
            Button (variant="subtle", size="xs", "Utwórz event dla tego beatu")
```

### 8.2 Narrative Gaps Panel

```
Aside panel (AppShell.Aside) LUB dedykowana strona /kampania/[id]/narracja

Stack
├── Group
│   ├── Title (order=3, "Luki narracyjne")
│   └── Badge (circle, size="lg", color="red", count: np. "5")
├── Text (size="sm", c="dimmed", "Strukturalne braki wykryte automatycznie")
├── Accordion (variant="separated")
│   ├── Accordion.Item (value="beats")
│   │   ├── Accordion.Control
│   │   │   └── Group → Text "Niewypełnione beaty" + Badge (count)
│   │   └── Accordion.Panel
│   │       └── Stack (gap="xs")
│   │           └── NavLink × N
│   │               ├── label: nazwa beatu
│   │               ├── description: nazwa wątku
│   │               └── href → thread detail + beat highlight
│   │
│   ├── Accordion.Item (value="archetypes")
│   │   ├── Accordion.Control
│   │   │   └── Group → Text "Brakujące archetypy" + Badge (count)
│   │   └── Accordion.Panel
│   │       └── Stack (gap="xs")
│   │           └── Card × N
│   │               ├── Text (wątek)
│   │               ├── Badge.Group → brakujące archetypy
│   │               └── Text (c="dimmed", sugestia)
│   │
│   ├── Accordion.Item (value="chekhov")
│   │   ├── Accordion.Control
│   │   │   └── Group → Text "Chekhov's Gun bez rozwiązania" + Badge (count)
│   │   └── Accordion.Panel
│   │       └── Stack (gap="xs")
│   │           └── NavLink × N
│   │               ├── label: description_pl chekhov_item
│   │               └── description: "Setup w sesji #N"
│   │
│   └── Accordion.Item (value="spotlight")
│       ├── Accordion.Control
│       │   └── Group → Text "Spotlight — zapomniane postacie" + Badge (count)
│       └── Accordion.Panel
│           └── Stack (gap="xs")
│               └── Card × N
│                   ├── Group → Avatar + Text (nazwa postaci)
│                   └── Text (c="dimmed", "Ostatni spotlight: sesja #N, X sesji temu")
```

### 8.3 NPC Archetype Tags (widok szczegółów NPC)

```
Card (NPC profile — rozszerzenie istniejącego widoku)
├── ... istniejące pola NPC z głównego PRD ...
├── Divider (label="Narracja")
└── Stack (gap="sm")
    ├── Text (weight=600, size="sm", "Archetypy narracyjne")
    ├── Select (label="Wątek", data=wątki kampanii)
    ├── MultiSelect
    │   label: "Archetypy w wybranym wątku"
    │   data: ['Mentor', 'Cień', 'Trickster', 'Herold', 'Zmiennokształtny',
    │          'Strażnik Progu', 'Sojusznik', 'Antagonista']
    ├── Textarea (label="Notatki", placeholder="Dlaczego ta rola?")
    └── Group (display mode — podsumowanie wszystkich wątków)
        └── Stack × N wątków
            ├── Text (size="xs", c="dimmed", nazwa wątku)
            └── Badge.Group
                └── Badge × N archetypów
```

### 8.4 Event Creation/Edit — Beat Assignment

```
Modal (size="lg", title="Nowy event" | "Edytuj event")
├── TextInput (label="Nazwa eventu", required)
├── Textarea (label="Opis", autosize, minRows=3)
├── Select (label="Wątek", data=wątki kampanii, clearable)
├── Collapse (in={threadSelected && threadHasTemplate})
│   └── Select
│       label: "Przypisz do beatu"
│       description: "Beaty z szablonu: {templateName}"
│       data: beaty wybranego wątku (z oznaczeniem wypełnionych)
│       clearable
├── Divider (my="sm")
├── Checkbox (label="To jest Chekhov's Gun (setup)")
│   └── Collapse (in={isChekhovChecked})
│       └── Textarea
│           label: "Co zostało zasiane?"
│           placeholder: "Zatruty sztylet wspomniany przez kapłana..."
├── Space
└── Group (justify="flex-end")
    ├── Button (variant="subtle", "Anuluj")
    └── Button (color="blue", "Zapisz event")
```

---

## 9. Biblioteka szablonów — pełna specyfikacja

### 9.1 Podróż Bohatera / Hero's Journey (12 beatów)

| # | name | name_pl | description_pl | example_pl | is_optional |
|---|------|---------|----------------|------------|-------------|
| 1 | Ordinary World | Zwykły świat | Pokazanie normalnego życia bohatera zanim historia się zacznie. | Drużyna spędza wieczór w tawernie w rodzinnym mieście — spokojne życie przed burzą. | false |
| 2 | Call to Adventure | Wezwanie do przygody | Wydarzenie które wyrwuje bohatera ze status quo. | Posłaniec przynosi wieść o zaginionym artefakcie — burmistrz prosi drużynę o pomoc. | false |
| 3 | Refusal of the Call | Odmowa wezwania | Bohater waha się lub odmawia podjęcia wyzwania. | Wojownik argumentuje że to nie ich sprawa — drużyna debatuje czy warto ryzykować. | true |
| 4 | Meeting the Mentor | Spotkanie z Mentorem | Pojawia się przewodnik który daje wiedzę, narzędzie lub motywację. | Starszy mag z wieży oferuje mapę podziemi i ostrzega przed strażnikami. | false |
| 5 | Crossing the Threshold | Przekroczenie progu | Bohater nieodwracalnie wchodzi w nowy świat / nową sytuację. | Drużyna wchodzi do Mrocznego Lasu — za nimi zamyka się magiczna bariera. | false |
| 6 | Tests, Allies, Enemies | Próby, sojusznicy, wrogowie | Seria wyzwań, nowe sojusze i odkrycie prawdziwych wrogów. | Walka z bandytami, sojusz z druidką, odkrycie że kupiec pracuje dla kultu. | false |
| 7 | Approach to the Inmost Cave | Zbliżenie do Najgłębszej Jaskini | Przygotowania do kluczowej konfrontacji — napięcie rośnie. | Drużyna dociera pod bramy cytadeli nekromanty i planuje infiltrację. | false |
| 8 | The Ordeal | Próba najwyższa | Kulminacyjna konfrontacja — bohater stawia czoła śmierci lub największemu lękowi. | Walka z nekromantą w jego twierdzy — wojownik prawie ginie chroniąc maga. | false |
| 9 | The Reward | Nagroda | Bohater zdobywa to, po co przyszedł — artefakt, wiedzę, wolność. | Drużyna odzyskuje Koronę Świtu z ruin cytadeli. | false |
| 10 | The Road Back | Droga powrotna | Powrót do zwykłego świata — często z nowymi zagrożeniami w ślad za bohaterem. | Ucieczka z cytadeli podczas trzęsienia ziemi — nekromanta nie jest martwy. | true |
| 11 | The Resurrection | Zmartwychwstanie | Ostateczna próba — bohater musi zastosować wszystko czego się nauczył. | Nekromanta atakuje miasto — drużyna musi użyć Korony i sojuszy zebranych po drodze. | false |
| 12 | Return with the Elixir | Powrót z eliksirem | Bohater wraca odmieniony — świat jest inny niż na początku. | Drużyna wraca jako bohaterowie — wojownik został rycerzem, mag zyskał ucznia. | false |

### 9.2 Łuk Tajemnicy / Mystery Arc (7 beatów)

| # | name | name_pl | description_pl | example_pl | is_optional |
|---|------|---------|----------------|------------|-------------|
| 1 | Setup / Hook | Zawiązanie / Hak | Odkrycie problemu — coś jest nie tak i wymaga wyjaśnienia. | W porcie znaleziono ciało kupca z tajemniczym symbolem wypalonym na dłoni. | false |
| 2 | First Clue | Pierwszy trop | Pierwszy fragment układanki wskazujący kierunek śledztwa. | Świadek widział kobietę w czerwonym płaszczu wychodzącą z magazynu ofiary. | false |
| 3 | False Lead | Fałszywy trop (Red Herring) | Poszlaka która prowadzi w ślepą uliczkę — zwiększa napięcie. | Kobieta w czerwonym okazuje się siostrą ofiary — szukała brata, nie zabiła go. | false |
| 4 | Escalation / Threat | Eskalacja / Zagrożenie | Stawka rośnie — sprawca wie o śledztwie lub pojawiają się nowe ofiary. | Kolejny kupiec znika — tym razem z wiadomością „przestańcie szukać". | false |
| 5 | Key Revelation | Kluczowe odkrycie | Przełomowy trop który zmienia rozumienie sprawy. | Symbol na dłoni to pieczęć starego paktu — ofiary były sygnatariuszami. | false |
| 6 | Confrontation | Konfrontacja | Bezpośrednie starcie z prawdą / sprawcą. | Drużyna konfrontuje burmistrza — to on zlecił zabójstwa by ukryć pakt z demonem. | false |
| 7 | Resolution | Rozwiązanie | Sprawa zostaje zamknięta — konsekwencje i nowy status quo. | Burmistrz aresztowany, pakt złamany — ale demon został uwolniony. | false |

### 9.3 Struktura 3-aktowa / 3-Act Structure (6 beatów)

| # | name | name_pl | description_pl | example_pl | is_optional |
|---|------|---------|----------------|------------|-------------|
| 1 | Setup | Ekspozycja | Wprowadzenie postaci, świata i status quo. | Drużyna przybywa do miasta na festiwal — poznajemy NPC i lokacje. | false |
| 2 | Inciting Incident | Incydent inicjujący | Wydarzenie które uruchamia główny konflikt. | Podczas festiwalu ginie wyrocznia — jej ostatnie słowa to „oni już tu są". | false |
| 3 | Rising Action | Akcja wznosząca | Serie komplikacji, rosnące stawki, narastający konflikt. | Kolejne ataki, odkrycie że kult infiltrował straż miejską, sojusz z druidami. | false |
| 4 | Climax | Kulminacja | Punkt najwyższego napięcia — decydujące starcie lub wybór. | Bitwa pod murami miasta — drużyna musi wybrać: bronić bramy lub ratować zakładników. | false |
| 5 | Falling Action | Akcja opadająca | Bezpośrednie konsekwencje kulminacji — rozwiązywanie wątków. | Po bitwie — liczenie strat, odkrycie że lider kultu uciekł, nagrody od burmistrza. | true |
| 6 | Resolution | Rozwiązanie | Nowy status quo — co się zmieniło na stałe. | Miasto odbudowane, ale druidzi zerwali sojusz — nowe napięcia na horyzoncie. | false |

### 9.4 Łuk Tragedii / Tragedy Arc (6 beatów)

| # | name | name_pl | description_pl | example_pl | is_optional |
|---|------|---------|----------------|------------|-------------|
| 1 | Exposition (Flaw Established) | Ekspozycja (ukazanie słabości) | Przedstawienie bohatera i jego tragicznej wady — pychy, ambicji, naiwności. | Rycerz paladyn jest niezachwianie przekonany o moralnej wyższości swojego zakonu. | false |
| 2 | Rising Action (Flaw Exploited) | Akcja wznosząca (wykorzystanie wady) | Wada bohatera jest testowana — i przez nią podejmuje złe decyzje. | Paladyn skazuje niewinnego na śmierć bo „zakon nigdy się nie myli". | false |
| 3 | Crisis Point | Punkt kryzysowy | Moment w którym jeszcze można się wycofać — ale bohater tego nie robi. | Drużyna ostrzega paladyna, że zakon jest skorumpowany — paladyn odmawia uwierzenia. | false |
| 4 | Downfall Begins | Początek upadku | Konsekwencje kumulują się — bohater zaczyna tracić to, co cenił. | Zakon odwraca się od paladyna gdy ujawnia się korupcja — ale on wini drużynę. | false |
| 5 | Moment of Recognition | Moment rozpoznania | Bohater wreszcie widzi prawdę — ale może być za późno. | Paladyn odkrywa że niewinny którego skazał był jego dawnym uczniem. | false |
| 6 | Catastrophe | Katastrofa | Ostateczna konsekwencja — śmierć, utrata, nieodwracalna zmiana. | Paladyn ginie broniąc drużyny przed zakonem — jego poświęcenie to jedyne odkupienie. | false |

### 9.5 Łuk Odkupienia / Redemption Arc (6 beatów)

| # | name | name_pl | description_pl | example_pl | is_optional |
|---|------|---------|----------------|------------|-------------|
| 1 | The Sin / Flaw | Grzech / Wada | Bohater ma mroczną przeszłość lub fundamentalną wadę. | Łotrzyk zdradził swoją gildię za złoto — przez co zginęli jego towarzysze. | false |
| 2 | Consequences | Konsekwencje | Wada lub grzech rzucają cień na obecne życie bohatera. | Ocalały z gildii odnajduje łotrza — wymaga zwrotu długu lub grozi zemstą. | false |
| 3 | The Rock Bottom | Dno | Bohater uderza w dno — traci wszystko lub stawia czoła najgorszemu w sobie. | Łotrzyk próbuje znów zdradzić drużynę dla zysku — i zostaje przyłapany. Drużyna go porzuca. | false |
| 4 | The Turning Point | Punkt zwrotny | Coś lub ktoś daje bohaterowi powód do zmiany. | Dziecko w wiosce mówi łotrzyce że wierzy w niego — bo pomógł im uciec z pożaru. | false |
| 5 | Active Amends | Czynne zadośćuczynienie | Bohater aktywnie naprawia szkody — nie słowem, ale czynem. | Łotrzyk wraca do gildii, oddaje złoto i ryzykuje życie by uratować ocalałego. | false |
| 6 | Redemption Achieved | Odkupienie osiągnięte | Bohater zostaje zaakceptowany na nowo — lub ginie jako ktoś inny niż był. | Ocalały przebacza łotrzykowi — gildia odradza się z nowym kodeksem. | false |

### 9.6 Łuk Zemsty / Revenge Arc (5 beatów)

| # | name | name_pl | description_pl | example_pl | is_optional |
|---|------|---------|----------------|------------|-------------|
| 1 | The Injustice | Niesprawiedliwość | Bohaterowi lub bliskiej osobie dzieje się krzywda. | Wioska barbarzyńki zostaje spalona przez najemników barona. | false |
| 2 | Obsession Forms | Narodziny obsesji | Bohater poświęca się jedynemu celowi — zemście. Traci perspektywę. | Barbarzyńka odrzuca inne questy, śni o baronie, zbiera informacje o jego twierdzy. | false |
| 3 | Preparation / Cost | Przygotowanie / Koszt | Bohater przygotowuje się do konfrontacji — płacąc cenę za obsesję. | Barbarzyńka werbuje zabójcę, co kosztuje ją zaufanie druida w drużynie. | false |
| 4 | Confrontation | Konfrontacja | Bezpośrednie starcie z obiektem zemsty. | Atak na twierdzę barona — barbarzyńka staje z nim twarzą w twarz. | false |
| 5 | The Price of Revenge | Cena zemsty | Zemsta dokonana (lub nie) — ale zawsze jest cena. | Baron zabity, ale twierdza płonie — w środku byli niewinni poddani. Barbarzyńka stała się tym, co zwalczała. | false |

---

## 10. Metryki sukcesu

### Metryki adopcji

| Metryka | Cel | Okres pomiaru |
|---------|-----|---------------|
| % kampanii z ≥1 wątkiem używającym szablonu | 40% | 30 dni od premiery |
| % MG otwierających Panel luk narracyjnych ≥1x/tydzień | 25% | 30 dni od premiery |
| Średnia liczba wypełnionych beatów per kampania per tydzień | ≥ 3 | 30 dni od premiery |
| % MG używających tagów archetypowych na ≥1 NPC | 30% | 30 dni od premiery |

### Metryki wartości

| Metryka | Metoda pomiaru | Cel |
|---------|----------------|-----|
| Retencja MG z szablonami vs. bez | Porównanie kohort: MG którzy przypisali ≥1 szablon vs. MG bez szablonów — retencja po 60 dniach | Δ retencji ≥ 15pp |
| Czas przygotowania sesji | Ankieta in-app co 4 tygodnie: „Ile czasu zajmuje Ci przygotowanie sesji?" | Spadek o ≥ 20% |
| Rozwiązywanie Chekhov's Gun | % setupów które otrzymują payoff w ciągu 5 sesji | ≥ 60% |
| Spotlight equity | Odchylenie standardowe sesji między spotlight momentami per postać | Spadek o ≥ 30% |

### Metryki sygnałowe dla AI (v1.1)

| Metryka | Interpretacja |
|---------|---------------|
| % MG którzy klikają pusty beat ale nie tworzą eventu | Wysoki % → AI sugestia eventów ma silny use case |
| % wątków z ≥3 pustymi obowiązkowymi beatami po 4+ sesjach | Wysoki % → MG potrzebują pomocy z uzupełnieniem struktury |
| % NPC bez żadnego archetypu w wątkach z szablonem | Wysoki % → AI sugestia archetypów ma sens |

---

## 11. Poza zakresem (Out of scope)

| Funkcjonalność | Status | Uzasadnienie |
|----------------|--------|--------------|
| Udostępnianie szablonów między użytkownikami (Community Templates) | v2.0 | Wymaga systemu moderacji i oceniania |
| Tworzenie własnych szablonów przez MG | v1.1 | MVP testuje wbudowane szablony — walidacja czy MG w ogóle używają szablonów |
| Widoczność szablonów narracyjnych dla graczy | Nigdy (celowa decyzja) | Gracze nigdy nie widzą strukturalnego planowania MG — to by złamało immersję |
| Automatyczne przypisywanie eventów do beatów bez potwierdzenia MG | Nigdy (celowa decyzja) | Narusza zasadę „Zawsze MG decyduje" |
| System oceniania narracji / „nota" za kampanię | Nigdy (celowa decyzja) | Narzędzie nigdy nie ocenia jakości — pokazuje strukturę, nie wartościuje |
| Integracja z opublikowanymi modułami (np. mapowanie Curse of Strahd na beaty) | v2.0 | Wymaga licencji wydawców i manualnego mapowania per moduł |
| Player-facing quest tracker powiązany z beatami | v1.2 | Gracze mogą widzieć questy, ale nie szablony ani beaty — wymaga osobnego warstwy abstrakcji |

---

## 12. Otwarte pytania

| # | Pytanie | Właściciel | Status | Blokujące? |
|---|---------|------------|--------|------------|
| 1 | Czy tabela `threads` powinna być aliasem na istniejącą tabelę `quests` z głównego PRD, czy osobną encją? Thread ≠ Quest semantycznie (wątek to linia narracyjna, quest to zadanie) — ale w UI mogą być prezentowane razem. | Solo dev | Otwarte | **Tak** — wpływa na schemat danych |
| 2 | Czy beat tracker powinien być widoczny na liście wątków (miniaturowy pasek) czy tylko w widoku szczegółów? | Solo dev | Otwarte | Nie |
| 3 | Czy MG powinien móc przypisać ten sam event do dwóch beatów w tym samym wątku (np. event wypełnia „Próba" i „Sojusznicy" jednocześnie)? | Solo dev | Otwarte | Nie — obecny schemat blokuje (UNIQUE na beat_id + thread_id), ale event może wypełniać beaty w różnych wątkach |
| 4 | Jak obsłużyć sytuację gdy MG zmienia szablon wątku na inny? Wyczyścić assignmenty czy próbować mapować stare beaty na nowe? | Solo dev | Otwarte | Nie — rekomendacja: wyczyścić z potwierdzeniem |
| 5 | Czy Panel luk narracyjnych powinien być osobną stroną (`/kampania/[id]/narracja`) czy panelem bocznym (AppShell.Aside)? | Solo dev | Otwarte | Nie — decyzja UI, nie wpływa na model danych |
| 6 | Domyślna konfiguracja Spotlight Tracker: 3 sesje czy 5 sesji? | Solo dev | Otwarte | Nie — konfigurowalne, domyślna wartość do walidacji |

---

## 13. Zależności od głównego PRD

Ten dokument zakłada istnienie następujących encji zdefiniowanych w `campaign-layer-prd.pplx.md`:

| Encja | Tabela | Wymagane pola |
|-------|--------|---------------|
| Kampania | `campaigns` | `id`, `name`, `created_by` |
| Postać gracza | `characters` | `id`, `campaign_id`, `player_id`, `name` |
| NPC | `npcs` | `id`, `campaign_id`, `name` |
| Członek kampanii | `campaign_members` | `id`, `campaign_id`, `user_id`, `role`, `character_id` |
| Event | `events` | `id`, `campaign_id` — **⚠️ WAŻNE:** tabela `events` nie jest jawnie zdefiniowana w obecnym głównym PRD (istnieją `scenes`, `npc_interactions`, `knowledge_nodes`). Konieczne rozstrzygnięcie: czy `events` to nowa tabela czy alias na istniejące encje. |

**🚨 KRYTYCZNE:** Przed implementacją Narrative Engine konieczne jest rozstrzygnięcie pytania #1 (threads vs. quests) i zdefiniowanie tabeli `events` w głównym PRD lub w migracji. Obecny główny PRD używa pojęcia `scenes` i `quests` — ale Event w kontekście narracyjnym to inna abstrakcja (zmiana stanu świata, nie moment gry ani zadanie).

---

## 14. Harmonogram implementacji

| Tydzień | Zadania | Deliverable |
|---------|---------|-------------|
| **1** | Schema migration: `threads`, `narrative_templates`, `narrative_beats`. Seed danych 6 szablonów (42 beaty). RLS. | Baza danych gotowa, seed zweryfikowany |
| **2** | Schema: `thread_narrative_templates`, `event_beat_assignments`, `npc_archetype_tags`. CRUD API (Supabase client functions). | Pełny model danych + API |
| **3** | Beat Tracker UI — komponent, integracja z widokiem wątku. Thread Template Assignment (Select w widoku wątku). | MG może przypisać szablon i zobaczyć beaty |
| **4** | Event → Beat Assignment (rozszerzenie Modal eventu). NPC Archetype Tagging (rozszerzenie profilu NPC). | MG może wypełniać beaty i tagować NPC |
| **5** | Chekhov's Gun tracking. Spotlight Tracker. Migracja tabeli `events`. | Pełna mechanika śledzenia |
| **6** | Narrative Gaps Panel — agregacja wszystkich luk. Testy z własną kampanią. | Feature kompletny do testu |

---

_Koniec dokumentu. Narrative Engine v0.1 — Campaign Layer._
