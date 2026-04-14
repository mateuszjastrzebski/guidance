export type GuidanceReleaseNote = {
  version: string;
  date: string;
  title: string;
  changes: string[];
};

export const guidanceReleaseNotes: GuidanceReleaseNote[] = [
  {
    version: "v0.1",
    date: "2026-04-03",
    title: "Fundament aplikacji",
    changes: [
      "Postawienie bazowego setupu projektu w Next.js 14 z Mantine.",
      "Dodanie integracji z Supabase, PWA i strony statusowej dostępnej pod localhost:3000.",
      "Przygotowanie pierwszej dokumentacji technicznej i schematu danych.",
    ],
  },
  {
    version: "v0.2",
    date: "2026-04-03",
    title: "Start logowania",
    changes: [
      "Dodanie pierwszej wersji ekranu logowania.",
      "Rozpoczęcie spięcia flow autoryzacji z aplikacją.",
    ],
  },
  {
    version: "v0.3",
    date: "2026-04-04",
    title: "Dokończone auth i poprawki setupu",
    changes: [
      "Domknięcie logowania przez magic link i callback autoryzacji.",
      "Poprawki techniczne stabilizujące środowisko startowe projektu.",
    ],
  },
  {
    version: "v0.4",
    date: "2026-04-05",
    title: "Przygotowanie dashboardu kampanii",
    changes: [
      "Dodanie fundamentów pod główny widok kampanii.",
      "Przygotowanie struktury aplikacji pod dalsze ekrany produktowe.",
    ],
  },
  {
    version: "v0.5",
    date: "2026-04-07",
    title: "Podstawy plannera",
    changes: [
      "Wdrożenie pierwszej wersji plannera i kluczowych mechanik pracy na wydarzeniach.",
      "Zbudowanie podstawowego stosu komponentów pod planowanie narracji.",
    ],
  },
  {
    version: "v0.6",
    date: "2026-04-09",
    title: "Timeline i ulepszenia interakcji",
    changes: [
      "Rozbudowa timeliny i zarządzania wydarzeniami w plannerze.",
      "Dodanie nowych edge'y, dopracowanie node'ów i optymalizacja interakcji.",
      "Poprawa stylów oraz zachowania komponentów planowania.",
    ],
  },
  {
    version: "v0.7",
    date: "2026-04-10",
    title: "Zarządzanie kampanią",
    changes: [
      "Dodanie funkcji zarządzania postaciami graczy i NPC-ami na dashboardzie kampanii.",
      "Rozszerzenie warstwy aplikacyjnej o bardziej użyteczne widoki kampanii.",
    ],
  },
  {
    version: "v0.8",
    date: "2026-04-12",
    title: "Analityka produktu",
    changes: [
      "Integracja PostHog z aplikacją Next.js.",
      "Przygotowanie projektu pod śledzenie zachowań i dalsze decyzje produktowe.",
    ],
  },
  {
    version: "v0.9",
    date: "2026-04-13",
    title: "Detale encji i lepsza nawigacja",
    changes: [
      "Dodanie bardziej dopracowanych widoków szczegółów lokacji i NPC-ów.",
      "Poprawa nawigacji wstecz i ogólnego UX w formularzach oraz ekranach szczegółów.",
      "Rozszerzenie zarządzania kampanią o kolejne strony detali.",
    ],
  },
];
