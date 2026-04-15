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
    title: "Start przestrzeni roboczej Campaign Layer",
    changes: [
      "Powstała pierwsza wersja aplikacji, na której można oprzeć dalszy rozwój workspace'u dla MG.",
      "Uruchomiono bazową stronę produktu i fundament pod docelowe ekrany kampanii.",
      "Przygotowano model danych, który pozwolił szybko dokładać kolejne moduły kampanii."
    ],
  },
  {
    version: "v0.2",
    date: "2026-04-03",
    title: "Pierwszy dostęp do aplikacji",
    changes: [
      "Pojawił się ekran logowania otwierający drogę do prywatnego workspace'u użytkownika.",
      "Rozpoczęto spinanie pełnego wejścia do aplikacji bez ręcznej obsługi po stronie administratora."
    ],
  },
  {
    version: "v0.3",
    date: "2026-04-04",
    title: "Działające logowanie i wejście do workspace'u",
    changes: [
      "Logowanie przez magic link zostało domknięte, więc użytkownik może wejść do swojej przestrzeni bez hasła.",
      "Dopracowano stabilność podstawowego flow wejścia do aplikacji."
    ],
  },
  {
    version: "v0.4",
    date: "2026-04-05",
    title: "Początek dashboardu fabuł",
    changes: [
      "Powstał zrąb głównego widoku, z którego użytkownik może wchodzić do swoich kampanii i jednostrzałów.",
      "Ułożono strukturę aplikacji pod kolejne moduły pracy MG."
    ],
  },
  {
    version: "v0.5",
    date: "2026-04-07",
    title: "Pierwszy planner fabuły",
    changes: [
      "Do aplikacji wszedł planner, w którym można zacząć rozpisywać wydarzenia i kierunek fabuły.",
      "Pojawił się pierwszy zestaw mechanik potrzebnych do pracy na wątkach i eventach."
    ],
  },
  {
    version: "v0.6",
    date: "2026-04-09",
    title: "Lepsza oś wydarzeń i wygodniejsza praca w plannerze",
    changes: [
      "Planner zyskał bardziej dopracowaną oś wydarzeń, dzięki której łatwiej ogarnąć przebieg historii.",
      "Usprawniono interakcje podczas pracy na eventach i połączeniach między nimi.",
      "Całość stała się czytelniejsza wizualnie i wygodniejsza w codziennym użyciu."
    ],
  },
  {
    version: "v0.7",
    date: "2026-04-10",
    title: "Roster postaci i wątki kampanii",
    changes: [
      "Doszło zarządzanie postaciami graczy oraz NPC-ami wewnątrz kampanii.",
      "Wątki kampanii zostały lepiej spięte z plannerem i resztą workspace'u."
    ],
  },
  {
    version: "v0.8",
    date: "2026-04-12",
    title: "Lepsza obserwowalność produktu",
    changes: [
      "Produkt został przygotowany do zbierania sygnałów o tym, jak użytkownicy pracują w aplikacji.",
      "To tworzy bazę pod kolejne decyzje o UX i priorytetach rozwoju."
    ],
  },
  {
    version: "v0.9",
    date: "2026-04-13",
    title: "Detale encji i szybsze docieranie do informacji",
    changes: [
      "Pojawiły się dopracowane widoki szczegółów lokacji, NPC-ów, postaci graczy i questów.",
      "Nawigacja stała się płynniejsza, więc łatwiej wracać między listami a detalami.",
      "Rozbudowano roboczą bazę kampanii o notatki, powiązania i kolejne strony szczegółów."
    ],
  },
  {
    version: "v1.0",
    date: "2026-04-14",
    title: "Dashboard sesji i praca na scenach",
    changes: [
      "Do kampanii doszedł dashboard sesji z listą sesji i szybkim wejściem w bieżący kontekst prowadzenia.",
      "Można przełączać widok między trybem eksploracji i walki zależnie od tempa spotkania.",
      "Sceny da się przypinać do sesji, porządkować i wykorzystywać jako praktyczny plan prowadzenia."
    ],
  },
  {
    version: "v1.1",
    date: "2026-04-14",
    title: "Konfiguracja postaci i bogatsza baza świata",
    changes: [
      "Pojawiła się konfiguracja postaci, która porządkuje kluczowe informacje potrzebne przy prowadzeniu bohaterów.",
      "Świat kampanii dostał bogatsze wpisy, kolekcje oraz lepsze powiązania między elementami.",
      "Wyszukiwarka i widoki szczegółów lepiej prowadzą użytkownika przez złożoną kampanię."
    ],
  },
];
