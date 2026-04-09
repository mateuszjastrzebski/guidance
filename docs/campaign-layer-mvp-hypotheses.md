# Campaign Layer — Akty wiary, hipotezy i wskaźniki MVP

```
Dokument: Walidacja MVP
Wersja:   v0.1
Data:     2026-04-06
Produkt:  Campaign Layer
Autor:    Solo / UX designer
```

---

## Jedno zdanie o celu tego dokumentu

Zanim wydasz czas na budowanie, jasno określ w co wierzysz (akty wiary), co możesz przetestować (hipotezy) i jak zmierzysz czy miałeś rację (wskaźniki). Dokument ten zbiera ustalenia z fazy discovery i nadaje im strukturę gotową do walidacji.

---

## Najważniejszy akt wiary

> **Gm-owie odczuwają wystarczający ból związany z zarządzaniem narracją i wiedzą graczy, żeby zmienić swoje obecne narzędzia (Notion, OneNote, papier) na dedykowane rozwiązanie — i zapłacić za nie.**

Jeśli to nieprawda, cały produkt nie ma racji bytu. Wszystko inne jest drugorzędne.

---

## 1. Akty wiary

Akty wiary to założenia, których **nie możesz przetestować zanim zbudujesz** — lub których koszt weryfikacji przed budowaniem jest zbyt wysoki. Wierzysz w nie i akceptujesz ryzyko.

| # | Akt wiary | Dlaczego nie możesz tego przetestować wcześniej |
|---|-----------|------------------------------------------------|
| AW-1 | Koncepcja „asymetrycznej wiedzy" (MG bramkuje co gracze wiedzą) jest wystarczająco intuicyjna dla nietech GM-ów bez potrzeby onboardingu | Wymaga gotowego produktu do weryfikacji w terenie |
| AW-2 | Budowanie z Cursorem jako solo developer (UX designer) jest technicznie wykonalne dla tej złożoności stacku | Wymaga rzeczywistej próby budowania |
| AW-3 | Supabase RLS jest wystarczająco niezawodne jako fundament bezpieczeństwa asymetrii wiedzy | Wymaga środowiska produkcyjnego z prawdziwymi danymi |
| AW-4 | Społeczność TTRPG zaakceptuje przechowywanie danych kampanii w chmurze (vs lokalne narzędzia jak Obsidian) | Wymaga czasu i zaufania rynku |
| AW-5 | Własna grupa TTRPG jest wystarczająco reprezentatywna jako pierwsi testerzy — ich feedback wskazuje ogólny kierunek | Reprezentatywność grupy można ocenić dopiero w kontakcie z szerszym rynkiem |

---

## 2. Hipotezy

Hipotezy to założenia **testowalne** — z określoną metodą weryfikacji i progiem sukcesu.

Priorytet: **H** (blokująca) → **M** (ważna) → **L** (optymalizacyjna)

---

### Rynek

| ID | Hipoteza | Ryzyko | Jak testować | Próg sukcesu | Termin |
|----|----------|--------|--------------|--------------|--------|
| H-R1 | GM-owie używają co najmniej 2 różnych narzędzi do zarządzania kampanią (Notion + papier, Discord + notatki) i odczuwają fragmentację jako problem | **H** | Wywiad z 8-10 GM-ami poza własną grupą | ≥7/10 wskazuje na fragmentację jako ból | Przed startem budowania |
| H-R2 | GM jest decydentem zakupu — gracze nie płacą za narzędzia do kampanii, w których grają | **H** | Zapytaj w wywiadach: „Czy zapłaciłbyś za narzędzie którego używa twój GM? Ile?" | <20% graczy deklaruje gotowość do płacenia | Przed startem budowania |
| H-R3 | Grupy grające ≥2x/miesiąc mają wystarczającą częstotliwość, żeby uzasadnić płatny tool | M | Zapytaj w wywiadach o rytm gry | ≥60% badanych gra ≥2x/miesiąc | Przed startem budowania |

---

### Produkt — core value

| ID | Hipoteza | Ryzyko | Jak testować | Próg sukcesu | Termin |
|----|----------|--------|--------------|--------------|--------|
| H-P1 | Knowledge asymmetry (player widzi tylko odblokowane węzły) jest funkcją która tworzy „aha moment" i napędza retencję GM-a | **H** | Sesja testowa z własną grupą — obserwuj reakcję gdy gracz po raz pierwszy widzi swój Player Lens | GM spontanicznie chce pokazać to innym GM-om | Tydzień 1-2 po MVP |
| H-P2 | Session Lens (lista scen z panelem kontekstowym) jest wystarczająco szybki w użyciu podczas żywej sesji — GM sięga po narzędzie zamiast notatek | **H** | Test podczas 3 rzeczywistych sesji własnej grupy — liczymy ile razy GM otwiera tool vs sięga po alternatywę | ≥70% „sięgnięć po kontekst" przez tool | Tydzień 2-4 po MVP |
| H-P3 | Gracze aktywnie używają Player Lens — logują się między sesjami żeby przejrzeć odkrycia swojej postaci | M | Analityka: DAU Player Lens między sesjami | ≥50% graczy aktywnych w ciągu 48h po sesji | Miesiąc 1-2 po MVP |
| H-P4 | GM wykona workflow odblokowania wiedzy po sesji — nie zapomni i nie uzna go za zbyt żmudny | **H** | Obserwacja własnej grupy przez 5 sesji — czy odblokowania faktycznie się dzieją? | ≥4/5 sesji kończy się odblokowaną wiedzą w ciągu 48h | Tydzień 2-6 po MVP |
| H-P5 | Quick Capture zastępuje papierowe notatki MG podczas sesji improwizowanej | M | Porównaj: ile scen z sessji improvised ma wypełniony Quick Capture vs ile zostało na papierze | ≥60% improwizowanych scen uchwyconych w narzędziu | Miesiąc 1-2 po MVP |

---

### Produkt — onboarding i adopcja

| ID | Hipoteza | Ryzyko | Jak testować | Próg sukcesu | Termin |
|----|----------|--------|--------------|--------------|--------|
| H-O1 | Zaproszenie graczy przez link (Supabase invite) ma wystarczająco niski friction żeby cała grupa dołączyła przed pierwszą sesją | **H** | Test z własną grupą — ile osób dołącza w ciągu 24h od zaproszenia | ≥80% grupy aktywuje konto przed pierwszą sesją | Tydzień 1 po MVP |
| H-O2 | GM jest w stanie samodzielnie skonfigurować pierwszą kampanię (kampania + 3 sceny + zaproszenie graczy) w ≤20 minut bez instrukcji | M | Test z 3 GM-ami spoza grupy — zmierz czas i frustrację | ≥2/3 kończy setup w ≤20 min bez pomocy | Tydzień 3-4 po MVP |

---

### Model biznesowy

| ID | Hipoteza | Ryzyko | Jak testować | Próg sukcesu | Termin |
|----|----------|--------|--------------|--------------|--------|
| H-B1 | GM-owie przejdą z Free na Pro (~10€/mc) po doświadczeniu produktu przez ≥2 kampanie | **H** | Conversion rate Free → Pro w pierwszych 90 dniach | ≥8% konwersja w 90 dni od rejestracji | Miesiąc 2-3 po MVP |
| H-B2 | Free tier jest wystarczająco wartościowy żeby GM polecił go innemu GM-owi (viral loop) | M | Pytanie w onboardingu: „Skąd się dowiedziałeś?" + NPS po 30 dniach | ≥30% nowych GM-ów z polecenia | Miesiąc 2-3 po MVP |
| H-B3 | Gracze którzy doświadczą Player Lens stają się evangelistami — nakłaniają swojego GM-a do założenia konta | M | Tracking: ile kont GM-a zostało założonych po tym jak gracz już był w systemie (jako invited player w innej kampanii) | ≥10% GM-ów zaczynało jako gracz | Miesiąc 3-6 po MVP |

---

### Narrative Engine (przyszłość)

| ID | Hipoteza | Ryzyko | Jak testować | Próg sukcesu | Termin |
|----|----------|--------|--------------|--------------|--------|
| H-N1 | GM-owie którzy nie wiedzą jak połączyć wątki narracyjne chcą struktury (szablony, beat tracking) — nie tylko AI | M | Wywiad: „Czy używasz jakichś frameworków storytellingowych (Hero's Journey, 3-akty)? Czy chciałbyś mieć je w narzędziu?" | ≥6/10 odpowiedzi pozytywnych | Przed budowaniem Narrative Engine |
| H-N2 | Narrative Gaps Panel (lista strukturalnych luk) jest używany przez GM-ów w fazie planowania, nie tylko raz przy onboardingu | L | Analityka: ile razy Panel jest otwierany per GM per tydzień | ≥2 otwarcia/tydzień u GM-ów którzy go aktywowali | Miesiąc 2-3 po Narrative Engine |

---

## 3. Wskaźniki MVP

### North Star Metric

> **Liczba aktywnych kampanii z przynajmniej jednym KnowledgeNode odblokowanym w ciągu ostatnich 14 dni**

Dlaczego: łączy aktywność GM-a (tworzy i prowadzi kampanię) z aktywnością gracza (ma co odkrywać). Jeśli ta liczba rośnie — core loop działa.

---

### Supporting Metrics

| Kategoria | Wskaźnik | Cel (Miesiąc 3) |
|-----------|----------|-----------------|
| **Adopcja** | Liczba aktywnych kampanii (≥1 sesja/2 tygodnie) | 10 |
| **Adopcja** | Średnia liczba graczy per kampania | ≥3 |
| **Engagement GM** | % sesji z przynajmniej jednym odblokowanym KnowledgeNode w ≤48h | ≥60% |
| **Engagement GM** | % GM-ów używających Quick Capture podczas sesji | ≥40% |
| **Engagement Gracz** | % graczy aktywnych w Player Lens ≥1x/tydzień | ≥50% |
| **Retencja** | % GM-ów aktywnych po 30 dniach od rejestracji | ≥40% |
| **Retencja** | % GM-ów aktywnych po 60 dniach | ≥25% |
| **Monetyzacja** | Free → Pro conversion (90 dni) | ≥8% |
| **Wzrost** | % nowych rejestracji GM z polecenia | ≥30% |

---

### Metryki zdrowia technicznego (nie produktowe, ale ważne)

| Wskaźnik | Cel |
|----------|-----|
| Czas ładowania Session Lens (pierwsze wyświetlenie) | ≤2s |
| Czas wyszukiwania przez Spotlight (⌘K) | ≤500ms |
| Błędy RLS (knowledge leak incidents) | 0 |
| Uptime | ≥99.5% |

---

## 4. Co walidować przed budowaniem (0-2 tygodnie)

Zanim napiszesz pierwszą linię kodu — 3 rzeczy warte 2-4h rozmów:

1. **H-R1 + H-R2** — 5 wywiadów z GM-ami spoza własnej grupy. Pytania: jak zarządzają kampanią dziś, ile narzędzi używają, czy gracze kiedykolwiek pytają „co wiemy o tym NPCu", czy płaciliby za dedykowane narzędzie i ile.

2. **H-P1 (proto-test)** — pokaż GMom makiety Player Lens (lo-fi wireframe w Figmie). Czy rozumieją koncepcję bez wyjaśnienia? Czy reakcja jest „chcę to" czy „mam to w Notion"?

3. **H-O2 (przyszłość)** — zapisz hipotezę teraz, testuj po zbudowaniu pierwszego onboardingu.

---

## 5. Sygnały alarmowe (kiedy pivot)

Jeśli po pierwszych 60 dniach MVP zobaczysz:

- **Retencja GM po 30 dniach < 20%** → problem z core value, nie z marketingiem
- **0 odblokowanych KnowledgeNode mimo aktywnych kampanii** → workflow odblokowania jest zbyt trudny lub zbędny
- **Gracze nie logują się do Player Lens** → asymetria wiedzy nie jest wartością dla graczy
- **GM nie używa narzędzia podczas sesji** → Session Lens przegrywa z papierem — za wolny lub za skomplikowany

Każdy z tych sygnałów to rozmowa o kierunku — nie koniecznie pivot, ale konieczna analiza.

---

*Dokument żywy — aktualizuj po każdym tygodniu testów z własną grupą.*
