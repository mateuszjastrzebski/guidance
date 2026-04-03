# PRD — Campaign Layer
### Product Requirements Document · v0.1 · kwiecień 2026

---

## 1. Cel produktu

Campaign Layer to web aplikacja dla grup TTRPG (D&D, Call of Cthulhu i inne systemy) obsługująca **narracyjną warstwę kampanii** — to co dzieje się między mechaniką walki a historią. Produkt rozwiązuje problem asymetrycznej wiedzy: MG wie wszystko, gracze odkrywają stopniowo — i żadne narzędzie tego dziś nie zarządza.

**Jeden zdaniowy opis produktu:**
> Campaign Layer to narzędzie które pamięta twoją kampanię — co się wydarzyło, kto co wie i gdzie historia może pójść dalej.

---

## 2. Użytkownicy

### Persona A — Mistrz Gry (MG / GM / Keeper)
- Przygotowuje sesje 2–4h tygodniowo, używa OneNote/Google Docs + VTT
- Boli go: czas szukania notatek przed sceną, brak kontekstu gdy gracze wracają do NPC, chaos przy improwizacji
- Chce: jednego miejsca gdzie ma wszystko + szybkiego widoku "co tu się ostatnio wydarzyło"
- Decydent zakupowy — płaci za narzędzie, zaprasza graczy

### Persona B — Gracz (Player / Investigator)
- Gra raz na 1–2 tygodnie, często zapomina detale między sesjami
- Boli go: "kto to był?", "co mu powiedzieliśmy?", notatki na kartce które gubi
- Chce: szybkiej wyszukiwarki tego co jego postać wie + poczucia że kampania "żyje"
- Użytkownik zaproszony przez MG, niższy próg płatności

---

## 3. Problem i hipoteza

**Problem (potwierdzony w researchu):**
MG zarządza asymetryczną wiedzą fabularną ręcznie — w głowie, na kartce, w pięciu zakładkach jednocześnie. Gracze nie mają narzędzia które pokazuje *ich perspektywę* kampanii — co odkryli, kiedy, od kogo. Improwizowane sceny przepadają po sesji.

**Hipoteza produktu:**
Jeśli MG może w < 30 sekund zobaczyć pełny kontekst sceny przed wejściem graczy, i gracze mają timeline własnych odkryć dostępny między sesjami — obydwie grupy będą używać narzędzia regularnie i zapłacą za wygodę.

---

## 4. Zakres MVP

### W MVP

| Obszar | Funkcja |
|--------|---------|
| Kampania | Tworzenie, zapraszanie graczy (link), role: MG / gracz / obserwator |
| Sceny | CRUD scen, status (przygotowana / improwizowana / zakończona / zawieszona), powiązanie "skąd gracze tu trafili" |
| NPCe | Karta NPC, dziennik interakcji per sesja, co ujawnił / co ukrył (tylko MG) |
| Wiedza graczy | KnowledgeNode — fragment informacji tworzony przez MG, odblokowany per gracz |
| Widok gracza | Timeline odkryć, wyszukiwarka, karta NPC (tylko odblokowana wiedza) |
| Quick Capture | Uproszczony tryb "w trakcie sesji" — minimum pól, uzupełnienie po |
| Questy | Lista aktywnych / zakończonych / zawieszonych wątków, powiązanie ze scenami |

### Poza MVP (roadmap)

| Funkcja | Priorytet |
|---------|-----------|
| AI sugestie fabularne przy improwizacji | Wysoki (v1.1) |
| Graf wizualny kampanii (węzły + krawędzie) | Wysoki (v1.1) |
| Asynchroniczna warstwa między sesjami (dziennik postaci, zwiastun) | Średni (v1.2) |
| Kontekstowy scheduler sesji | Średni (v1.2) |
| Anonimowy feedback po sesji + dashboard MG | Niski (v2.0) |
| Sanity tracker dla CoC | Niski (v2.0) |
| Integracja z VTT (Foundry, Roll20) | Niski (v2.0) |

---

## 5. User Stories

### MG

```
Jako MG chcę stworzyć scenę z NPC i przypisać informacje które gracze
mogą odkryć, żeby nie zgubić kontekstu gdy wrócimy do tej lokacji.

Jako MG chcę zobaczyć "widok kontekstowy przed sceną" który pokazuje
mi ostatnią wizytę graczy, co wtedy powiedziano i co NPC ujawnił —
w ciągu 30 sekund.

Jako MG chcę podczas sesji szybko dodać nową scenę (tylko nazwa + 
kilka słów) i wrócić do niej po sesji żeby uzupełnić szczegóły.

Jako MG chcę odblokować konkretną informację dla konkretnego gracza
po tym jak jego postać ją odkryła — bez spoilerowania reszty grupy.

Jako MG chcę zobaczyć co wie każdy gracz z osobna, żeby nie popełnić
błędu i nie ujawnić przez przypadek tego co postać jeszcze nie odkryła.
```

### Gracz

```
Jako gracz chcę wyszukać "kapłan" i zobaczyć wszystkie interakcje
mojej postaci z tym NPC — chronologicznie, z kontekstem sesji.

Jako gracz chcę mieć timeline odkryć mojej postaci, żeby po tygodniu
przerwy szybko odtworzyć sobie co wiem i co jest ważne.

Jako gracz chcę zobaczyć kartę NPC z perspektywy mojej postaci —
tylko to co wiemy, bez spoilerów których nie odkryliśmy.

Jako gracz chcę dostać powiadomienie gdy MG odblokuje dla mnie
nową informację po sesji.
```

---

## 6. Model danych

```sql
-- Kampania
campaigns
  id, name, system (dnd5e | coc | other), created_by, created_at

-- Użytkownicy kampanii
campaign_members
  id, campaign_id, user_id, role (gm | player | observer)
  character_name, character_id

-- Postaci graczy
characters
  id, campaign_id, player_id, name, description, notes_gm (only GM)

-- Sceny / lokacje
scenes
  id, campaign_id, name, description
  status (prepared | improvised | completed | suspended)
  linked_from_scene_id (FK → scenes, nullable)
  session_number
  created_at

-- NPCe
npcs
  id, campaign_id, name, description
  hidden_notes (only GM visible)

-- Dziennik interakcji NPC ↔ Scena
npc_interactions
  id, npc_id, scene_id, session_number
  present_character_ids (array)
  revealed_content   -- co NPC powiedział / ujawnił (widoczne przez graczy po odblokowaniu)
  hidden_content     -- co NPC przemilczał (tylko GM)
  gm_notes

-- Węzły wiedzy (bramkowane informacje)
knowledge_nodes
  id, campaign_id, scene_id, npc_id (nullable), quest_id (nullable)
  content            -- pełna treść informacji (tylko GM)
  summary            -- skrócona wersja dla gracza (GM może dostosować)
  created_at, created_by (GM)

-- Odblokowania wiedzy per gracz
knowledge_unlocks
  id, knowledge_node_id, character_id
  unlocked_at (timestamp), session_number
  unlocked_by (GM user_id)

-- Questy / wątki fabularne
quests
  id, campaign_id, name, description
  status (active | completed | suspended)
  linked_scene_ids (array)
  linked_knowledge_ids (array)

-- Quick Capture (surowe notatki w trakcie sesji)
session_captures
  id, campaign_id, session_number
  raw_text           -- szybkie notatki MG
  processed (bool)   -- czy MG już przeniósł do scen/NPC/wiedzy
  created_at
```

### Bezpieczeństwo danych (Row Level Security — Supabase)

```
knowledge_nodes:     SELECT tylko GM
knowledge_unlocks:   SELECT jeśli character_id należy do zalogowanego gracza
npc_interactions:    revealed_content → SELECT po odblokowaniu; hidden_content → tylko GM
characters:          notes_gm → tylko GM; reszta → właściciel postaci
```

---

## 7. Kluczowe ekrany i przepływy

### 7.1 Dashboard kampanii (MG)

```
┌─────────────────────────────────────────────────────┐
│  Campaign Layer          [+ Nowa scena] [Sesja: #7] │
├──────────────┬──────────────────────────────────────┤
│ SCENY        │  AKTYWNE WĄTKI                        │
│              │                                        │
│ ● Świątynia  │  ◉ Tajemnica Kultu        [aktywny]  │
│   Kapłana    │  ◉ Zaginiony kupiec       [aktywny]  │
│              │  ○ Legenda o Smoku        [zawieszon] │
│ ● Tajemniczy │                                        │
│   Budynek ★  │  GRACZE                               │
│   [improw.]  │  Aldric    ████░ 12 odkryć            │
│              │  Alena     ███░░  8 odkryć             │
│ + Dodaj scenę│  Borek     ██░░░  5 odkryć             │
└──────────────┴──────────────────────────────────────┘
```

### 7.2 Widok sceny (MG) — "kontekst przed wejściem"

```
┌─────────────────────────────────────────────────────┐
│  ← Świątynia Kapłana Marka                          │
│  Ostatnia wizyta: Sesja 4 · 3 tygodnie temu         │
├─────────────────────────────────────────────────────┤
│  OSTATNIA INTERAKCJA                                 │
│  Gracze powiedzieli że szukają Księgi Cienia.        │
│  Kapłan zaprzeczył — Aldric go przycisnął.          │
│  Kapłan się wycofał, zmienił temat.                 │
│                                                      │
│  CO GRACZE WIEDZĄ (z tej sceny)                     │
│  ✓ Aldric: "Kapłan kłamał o Księdze"               │
│  ✓ Alena:  "Kapłan zna symbol Kultu"                │
│  ✗ Nikt:   "Kapłan pracuje dla Kultu" [ukryte]      │
├─────────────────────────────────────────────────────┤
│  NPCe w scenie          [+ Dodaj NPC]               │
│  👤 Kapłan Marek   [Historia] [Edytuj]              │
│  👤 Mnich strażnik [Historia] [Edytuj]              │
├─────────────────────────────────────────────────────┤
│  [▶ WEJDŹ W SCENĘ — Tryb sesji]                     │
└─────────────────────────────────────────────────────┘
```

### 7.3 Quick Capture (tryb sesji)

```
┌─────────────────────────────────────────────────────┐
│  ⚡ Sesja #7 — Quick Capture                         │
│  [Świątynia Kapłana] ▼                              │
├─────────────────────────────────────────────────────┤
│  Notatka:                                            │
│  ┌───────────────────────────────────────────────┐  │
│  │ Kapłan przyznał że zna Kult. Aldric wyciągnął │  │
│  │ amulet. Kapłan zbladł. Obiecał pomóc...        │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  Nowa lokacja?  [+ Dodaj scenę w locie]             │
│                                                      │
│  [Zapisz notatkę]          [Odblokuj wiedzę →]      │
└─────────────────────────────────────────────────────┘
```

### 7.4 Odblokowanie wiedzy (MG po sesji)

```
┌─────────────────────────────────────────────────────┐
│  Po sesji — Co gracze odkryli?                       │
│  Scena: Świątynia Kapłana · Sesja #7                │
├─────────────────────────────────────────────────────┤
│  Kapłan pracuje dla Kultu                           │
│  Odblokuj dla:                                       │
│  ☑ Aldric (postać była obecna)                     │
│  ☑ Alena  (postać była obecna)                     │
│  ☐ Borek  (nieobecny w tej scenie)                  │
│                                                      │
│  Podsumowanie dla gracza (edytowalne):              │
│  "Kapłan Marek przyznał powiązania z Kultem         │
│   po tym jak Aldric pokazał amulet."                │
│                                                      │
│  [Odblokuj i wyślij powiadomienie]                  │
└─────────────────────────────────────────────────────┘
```

### 7.5 Timeline gracza

```
┌─────────────────────────────────────────────────────┐
│  Aldric — Moje odkrycia           [Szukaj...]       │
├─────────────────────────────────────────────────────┤
│  SESJA 7 · 3 kwi 2026                               │
│  📍 Świątynia Kapłana Marka                         │
│  → Kapłan Marek przyznał powiązania z Kultem        │
│    po tym jak pokazałem amulet.              [info] │
│                                                      │
│  SESJA 4 · 12 mar 2026                              │
│  📍 Świątynia Kapłana Marka                         │
│  → Kapłan kłamał o Księdze Cienia — widziałem      │
│    że się bał gdy o nią zapytałem.           [info] │
│  → Kapłan zna symbol Kultu — zareagował na         │
│    znak który narysowała Alena.              [info] │
│                                                      │
│  SESJA 2 · 26 lut 2026                              │
│  📍 Tawerna Pod Czarnym Krukiem                     │
│  → Barman wspomniał o "ludziach w kapturach"        │
│    którzy szukali starego kupca.             [info] │
└─────────────────────────────────────────────────────┘
```

---

## 8. Stack technologiczny

| Warstwa | Technologia | Uzasadnienie |
|---------|-------------|-------------|
| Frontend | Next.js 14 (App Router) + TypeScript | Cursor dobrze generuje React/Next, SSR dla SEO |
| UI Components | Mantine | 100+ gotowych komponentów, wbudowany dark mode, Spotlight (⌘K), AppShell, Timeline — zero konfiguracji |
| Mobile (MVP) | PWA (manifest + service worker) | Instalowalność bez App Store, działa na iOS Safari 14.5+ i Android Chrome — zero dodatkowego kodu |
| Mobile (v1.1) | Capacitor | Wrapper na gotową webappę → App Store / Google Play, 100% code reuse, dostęp do natywnego mikrofonu i background audio |
| Backend / DB | Supabase (PostgreSQL + Storage) | Row Level Security, Auth, Realtime, przechowywanie audio chunks — zero devops |
| Auth | Supabase Auth (email + magic link) | Prosta rejestracja, zaproszenia linkiem |
| Hosting | Vercel | Deploy z GitHuba, darmowy tier, edge functions |
| AI (v1.1) | OpenAI API (GPT-4o) | Sugestie fabularne, streszczanie notatek |
| AI Audio (v1.2) | OpenAI Whisper API | Transkrypcja nagrań sesji → baza dla AI podsumowań |
| State | Zustand lub React Query | Lokalny cache, optimistic updates |

### Instalacja

```bash
npm install @mantine/core @mantine/hooks @mantine/spotlight @mantine/notifications
# Mobile (v1.1):
npx cap init && npm install @capacitor/core @capacitor/ios @capacitor/android
```

### Struktura projektu (Next.js)

```
/app
  /dashboard          ← lista kampanii
  /campaign/[id]
    /gm               ← widoki MG (sceny, NPC, wiedza, questy)
    /player           ← widoki gracza (timeline, wyszukiwarka)
    /session          ← quick capture tryb sesji
/components
  /gm                 ← komponenty widoku MG
  /player             ← komponenty widoku gracza
  /shared             ← karty NPC, knowledge nodes, itp.
/lib
  /supabase           ← klient, typy, RLS helpers
  /ai                 ← wrappery OpenAI (v1.1)
```

---

## 8.1 Strategia mobile

### Dwa scenariusze użycia

| Scenariusz | Urządzenie | Użytkownik | Wymagania |
|------------|------------|------------|-----------|
| Gra online (Discord/VTT) | Laptop / desktop | MG + gracze | Pełny desktop layout, szybki dostęp do kontekstu |
| Gra na żywo (face-to-face) | Laptop (MG) + telefon (gracze) | MG na laptopie, gracze na telefonie | MG: tablet/laptop, Gracze: **responsywny mobilny widok** |

### Podejście etapowe

**MVP — Responsive Web + PWA**

Mantine `AppShell` ma wbudowany tryb mobilny: sidebar automatycznie chowa się jako `Drawer` na małych ekranach. Zero dodatkowego CSS dla podstawowej responsywności.

Dodaj `manifest.json` + service worker → gracze mogą "zainstalować" aplikację z przeglądarki na telefonie bez App Store.

```
Breakpointy Mantine:
  xs: 576px   → telefon pionowo
  sm: 768px   → telefon poziomo / tablet
  md: 992px   → laptop (główny target MG)
  lg: 1200px  → desktop
```

**Widok gracza na telefonie (Player Lens)** — uproszczony AppShell:
- brak lewej szyny (Navbar ukryty)
- `Timeline` jako główna treść na pełną szerokość
- `TextInput` wyszukiwania na górze (sticky)
- `Drawer` z kartą NPC otwiera się na pełny ekran

**v1.1 — Capacitor wrapper**

Gdy MVP jest stabilny i jest popyt na appkę natywną: `npx cap add ios && npx cap add android`. Żadna linia kodu webowego nie zmienia się — Capacitor opakowuje gotowy build Next.js.

Dodatkowe możliwości przez Capacitor plugins:
- Natywny mikrofon (background audio gdy ekran wyłączony)
- Push notifications zamiast email (odblokowanie wiedzy)
- Haptic feedback

---

## 8.2 Architektura nagrywania sesji (v1.2 — uwzględnij teraz)

Nagrywanie sesji TTRPG to 2–4 godziny audio per sesja (~500 MB WAV / ~60 MB Opus). Nie buduj tego w MVP — ale **schemat danych i infrastruktura Supabase Storage muszą to uwzględniać od początku**.

### Model nagrywania

```
[Przeglądarka / Capacitor]
  MediaRecorder API
  ↓ chunk co 30s (Opus/webm, ~250 KB)
Supabase Storage
  /recordings/{campaign_id}/{session_number}/chunk_{n}.webm
  ↓ po sesji: scalenie chunków (Edge Function)
  /recordings/{campaign_id}/{session_number}/full.webm
  ↓
Whisper API (transkrypcja)
  ↓
GPT-4o (analiza: podsumowanie + sugestie KnowledgeNode)
  ↓
session_transcripts (DB)
```

**Dlaczego chunked upload:**
- Sieć MG może paść w trakcie sesji — nie tracisz całego nagrania
- Nie ma limitu 30s nagrania na iOS Safari (bug przy długich sesjach)
- Whisper może zacząć transkrypcję przed końcem sesji

### Rozszerzenie schematu danych

Dodaj do istniejących tabel i stwórz nową — bezkosztowo, bez wpływu na MVP:

```sql
-- Rozszerzenie tabeli session_captures:
session_captures
  + audio_url (text, nullable)              ← link do scalonego pliku w Supabase Storage
  + transcript_status                        ← enum: none | uploading | processing | done | error

-- Nowa tabela (v1.2, tworzona teraz, nieużywana w MVP):
session_transcripts
  id                uuid PK
  session_capture_id  uuid FK → session_captures
  campaign_id         uuid FK → campaigns
  session_number      integer

  full_text           text          ← surowa transkrypcja Whisper
  segments            jsonb         ← [{start_ms, end_ms, text, speaker_guess?}]

  ai_summary          text          ← GPT-4o: co się wydarzyło w sesji
  suggested_nodes     jsonb         ← [{name, content, scene_hint, npc_hint}]
                                       AI proponuje KnowledgeNode do zatwierdzenia przez MG
  ai_plot_hooks       jsonb         ← sugestie: skąd dalej może pójść historia

  whisper_model       text          ← wersja modelu (audit)
  processed_at        timestamptz
  created_at          timestamptz
```

### Przepływ AI po sesji (v1.2)

```
1. MG kończy sesję → klik "Zakończ i przetwórz nagranie"
2. Edge Function scala chunki → pełny plik webm
3. Whisper API → full_text + segments (z timestampami)
4. GPT-4o prompt:
   - kontekst: istniejące sceny, NPC, questy z kampanii
   - input: transkrypcja
   - output: ai_summary + suggested_nodes + ai_plot_hooks
5. MG widzi panel "Propozycje AI po sesji":
   - zatwierdza / odrzuca suggested_nodes → tworzą KnowledgeNode
   - zatwierdza plot_hooks → tworzą sugestie questów
6. Gracze dostają powiadomienie o odblokowaniu wiedzy (jak w MVP)
```

**MG zawsze zatwierdza** — AI nie tworzy KnowledgeNode bez akceptacji. Asymetria wiedzy pozostaje w rękach MG.

### Kluczowa zasada architektoniczna

> Supabase Storage bucket `recordings` — tworzysz go przy setupie projektu. Tabela `session_transcripts` — migracją przy v1.2. Klucze Whisper API — w `.env` od początku (puste w MVP). Żaden kod MVP nie zmienia się przy włączaniu nagrywania.

---

## 8.3 Architektura komponentów Mantine

Poniżej mapowanie głównych ekranów produktu na konkretne komponenty z biblioteki Mantine. Architektura opisana na "grubych klockach" — bez stylizacji, z naciskiem na strukturę.

### Layout globalny

```
MantineProvider
└── AppShell                    ← główny kontener (navbar + aside + main)
    ├── AppShell.Navbar         ← lewa szyna: lista scen / NPC / questów
    │   └── NavLink             ← każdy element listy (scena, NPC, quest)
    ├── AppShell.Main           ← centralna treść (panel kontekstowy sceny)
    └── AppShell.Aside          ← prawy panel: szczegóły NPC / KnowledgeNode
```

**Spotlight** (`@mantine/spotlight`) → globalny pasek ⌘K dostępny z każdego ekranu. Pozwala wyszukać scenę, NPC, quest lub KnowledgeNode bez opuszczania aktualnego widoku.

---

### Lens Switch — przełączanie widoków

```
Tabs                            ← główny przełącznik lens
├── Tabs.Tab "Sesja"            ← Session Lens (MVP)
├── Tabs.Tab "Mapa"             ← Map Lens (v1.1, React Flow)
└── Tabs.Tab "Gracz"            ← Player Lens (MVP)

(wewnątrz Map Lens)
Tabs                            ← sub-filtry widoku mapy
├── Tabs.Tab "📍 Lokacje"
├── Tabs.Tab "🧵 Wątek"
├── Tabs.Tab "👥 Postacie"
└── Tabs.Tab "📅 Ta sesja"
```

---

### Session Lens — widok MG (lista + panel kontekstowy)

```
AppShell.Navbar
└── Stack
    ├── TextInput               ← filtrowanie listy scen
    ├── Select                  ← filtr: quest / lokacja
    └── NavLink (×N)            ← sceny z Badge statusu
        └── Badge               ← prepared=default, improvised=orange,
                                   completed=gray, suspended=yellow

AppShell.Main
└── Stack
    ├── Text (nazwa sceny)
    ├── Text muted ("Ostatnia wizyta: Sesja 4")
    ├── Divider
    ├── Card                    ← "Ostatnia interakcja" — co się działo
    ├── Card                    ← "Co gracze wiedzą" — knowledge per player
    │   └── Checkbox (×N)       ← odblokuj wiedzę per gracz (Modal otwiera się po)
    └── Button "Wejdź w scenę" ← przejście do Quick Capture

AppShell.Aside
└── Drawer (lub Aside panel)    ← szczegóły NPC, przesuwa się z prawej
    ├── Card                    ← dane NPC
    ├── Timeline                ← historia interakcji NPC per sesja
    └── Textarea                ← notatki GM (hidden_notes)
```

---

### Quick Capture — tryb sesji

```
Modal (full-width lub Drawer)   ← otwierany z przycisku "Wejdź w scenę"
└── Stack
    ├── Select                  ← wybór aktywnej sceny (lub "nowa")
    ├── Textarea                ← surowe notatki MG
    ├── Button "+ Dodaj scenę w locie"
    └── Group
        ├── Button "Zapisz notatkę"
        └── Button "Odblokuj wiedzę →"  ← otwiera Modal odblokowania
```

---

### Modal odblokowania wiedzy (po sesji)

```
Modal
└── Stack
    ├── Text (nazwa KnowledgeNode)
    ├── Checkbox.Group          ← wybór graczy którzy odkryli informację
    │   └── Checkbox (×N)       ← per gracz, z podpisem postaci
    ├── Textarea                ← edytowalne podsumowanie dla gracza
    └── Button "Odblokuj i wyślij powiadomienie"
        → Notification (toast)  ← potwierdzenie odblokowania
```

---

### Player Lens — widok gracza

```
AppShell (uproszczony, bez GM controls)
└── Stack
    ├── TextInput               ← wyszukiwarka ("szukaj: kapłan")
    └── Timeline                ← odkrycia pogrupowane per sesja
        └── Timeline.Item (×N)  ← jedno odkrycie
            ├── Text (tytuł odkrycia)
            ├── Text muted (scena + data sesji)
            └── Badge           ← tag: NPC / lokacja / wątek

AppShell.Aside
└── Drawer                      ← karta NPC (tylko odblokowana wiedza)
    ├── Card (dane NPC)
    └── Timeline                ← interakcje postaci z tym NPC
```

**Kluczowa zasada**: w Player Lens nie renderuje się żadnego komponentu GM-only. Checkbox odblokowania, notatki hidden_notes, Textarea GM — nieobecne w drzewie DOM.

---

### Dashboard kampanii — wskaźniki MG

```
Grid (responsive)
└── Card (×N graczy)
    ├── Text (imię gracza / postaci)
    ├── Progress                ← % odkrytej wiedzy (unlocked / total nodes)
    └── Text muted ("X odkryć")
```

---

### Komponenty mobilne

```
(telefon gracza — Player Lens)
AppShell (collapsed navbar)
└── Stack (full width)
    ├── TextInput [sticky top]    ← wyszukiwarka
    └── Timeline                  ← odkrycia, pełna szerokość

(MG na tablecie — Session Lens)
AppShell
├── AppShell.Navbar [Drawer mode na mobile]
│   └── NavLink (×N)
└── AppShell.Main
    └── Stack (scrollable)
```

### Tabela komponentów — szybkie referencje

| Komponent Mantine | Użycie w produkcie |
|-------------------|--------------------|
| `AppShell` | Główny layout (navbar + aside + main) |
| `NavLink` | Lista scen / NPC / questów w lewej szynie |
| `Spotlight` | Globalny ⌘K — wyszukiwanie wszystkiego |
| `Tabs` | Lens Switch (Session / Map / Player) + sub-filtry Map Lens |
| `Drawer` | Panel szczegółów NPC / KnowledgeNode z prawej strony |
| `Timeline` | Feed odkryć gracza i historia interakcji NPC |
| `Badge` | Status sceny (prepared / improvised / completed / suspended) |
| `Card` | Karty NPC, KnowledgeNode, podsumowania interakcji |
| `Checkbox` | Odblokowanie wiedzy per gracz |
| `Textarea` | Quick Capture + notatki GM |
| `TextInput` | Filtrowanie listy scen, wyszukiwarka gracza |
| `Select` | Filtr quest / lokacja w Session Lens i Map Lens |
| `Modal` | Quick Capture (sesja) + workflow odblokowania wiedzy |
| `Notification` | Toast po odblokowaniu wiedzy dla gracza |
| `Progress` | Pasek odkryć per gracz w dashboard MG |
| `Button` | Akcje: wejdź w scenę, zapisz, odblokuj |

---

## 9. Harmonogram MVP (6 tygodni)

| Tydzień | Zadania | Deliverable |
|---------|---------|-------------|
| **1** | Setup projektu, Supabase schema, auth, zapraszanie graczy, role | Działa logowanie, MG może stworzyć kampanię i zaprosić graczy |
| **2** | CRUD scen, CRUD NPC, widok dashboardu MG | MG może zarządzać scenami i NPC |
| **3** | KnowledgeNode — tworzenie, bramkowanie, odblokowanie per gracz | Mechanika wiedzy działa end-to-end |
| **4** | Widok gracza — timeline odkryć, wyszukiwarka, karta NPC (ograniczona) | Gracz widzi swoją perspektywę kampanii |
| **5** | Quick Capture — tryb sesji, dziennik interakcji NPC, widok kontekstowy przed sceną | Produkt gotowy do testu na żywej sesji |
| **6** | Test z własną grupą, zbieranie feedbacku, bugfixy | Pierwsza sesja produkcyjna, lista poprawek |

---

## 10. Metryki sukcesu MVP

| Metryka | Cel po 6 tygodniach |
|---------|---------------------|
| Własna grupa używa narzędzia przez całą sesję | Tak (0 / 1) |
| MG otwiera "widok kontekstowy przed sceną" | ≥ 3 razy / sesja |
| Gracze wchodzą do timeline między sesjami | ≥ 2 graczy / tydzień |
| Quick capture użyty przy improwizowanej scenie | ≥ 1 raz / sesja |
| Willingness to pay (wstępna deklaracja) | ≥ 2 osoby z grupy testowej |

---

## 11. Otwarte decyzje projektowe

| Decyzja | Opcje | Rekomendacja |
|---------|-------|-------------|
| Kto zatwierdza wiedzę gracza? | A: MG ręcznie · B: MG po sesji z sugestią systemu · C: Reguły z góry | **B** — naturalny dla improwizacji |
| Model płatności | MG płaci, gracze gratis · Każdy płaci · Freemium | **MG płaci, gracze gratis** — mniejsza bariera adopcji |
| Status sceny "jednorazowa" | Osobna kategoria vs. flaga "niepubliczna" | Osobna kategoria z obsługą "zawieszona" |
| Notyfikacje dla graczy | In-app · Email · Opcjonalne push | Email na start, in-app w v1.1 |
| Improwizacja → powiązanie z wątkiem | Ręczne przez MG · AI sugestia · Automatyczne | Ręczne w MVP, AI sugestia w v1.1 |
