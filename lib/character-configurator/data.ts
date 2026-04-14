// Dane archetypów dla Konfiguratora Postaci (v1.0, bez AI).
// Źródło: docs/campaign-layer-character-configurator.md
// Uwaga: nazwy zmiennych i typy — angielskie; treści widoczne w UI — polskie.
// Uwaga: wartości stringów w ARCHETYPE_DATA używają backtick-ów, żeby uniknąć
//        kolizji cudzysłowów typograficznych (U+201D) z delimiterem JS.

export const BASE_TYPES = [
  'fortress',
  'guardian',
  'victim',
  'mercenary',
  'seeker',
  'mediator',
  'conqueror',
  'visionary',
  'savior',
] as const;

export type BaseType = (typeof BASE_TYPES)[number];
export type MaskZone = 'shadow' | 'balanced' | 'light';
export type WoundZone = 'repression' | 'struggle' | 'integration';

export const MASK_SUFFIX: Record<MaskZone, string> = {
  shadow: ' Cienia',
  balanced: '',
  light: ' Siły',
};

export const BASE_TYPE_DISPLAY: Record<BaseType, string> = {
  fortress: 'Twierdza',
  guardian: 'Strażnik',
  victim: 'Ofiara',
  mercenary: 'Najemnik',
  seeker: 'Poszukiwacz',
  mediator: 'Mediator',
  conqueror: 'Zdobywca',
  visionary: 'Wizjoner',
  savior: 'Zbawca',
};

export type NarrativeArc =
  | 'awakening'
  | 'redemption'
  | 'tragedy'
  | 'heros_journey'
  | 'coming_of_age'
  | 'mystery'
  | 'mentor';

export const ARC_LABEL: Record<NarrativeArc, string> = {
  awakening: 'Przebudzenie — postać musi odkryć prawdę o sobie',
  redemption: 'Odkupienie lub Upadek — postać walczy ze swoją naturą',
  tragedy: 'Tragedia lub Odkupienie — ambicja spala wszystko, łącznie z nią samą',
  heros_journey: 'Podróż Bohatera — musi opuścić bezpieczeństwo i wejść w świat, by się przemienić',
  coming_of_age: 'Dojrzewanie — musi odkryć, kim naprawdę jest, tworząc siebie, nie odnajdując',
  mystery: 'Tajemnica — musi stawić czoła prawdzie, której unikała',
  mentor: 'Mistrz — postać ukończyła własny łuk i jest gotowa prowadzić innych',
};

export type ArchetypeData = {
  tagline: string;
  tagline_shadow: string;
  tagline_light: string;
  core_desire: string;
  core_fear: string;
  wound_text: string;
  gift_text: string;
  shadow_repression: string;
  shadow_struggle: string;
  shadow_integration: string;
  conflicts_repression: [string, string, string];
  conflicts_struggle: [string, string, string];
  conflicts_integration: [string, string, string];
  hooks: [string, string, string];
  inspirations: [string, string, string];
  narrative_arc_repression: NarrativeArc;
  narrative_arc_struggle: NarrativeArc;
  narrative_arc_integration: NarrativeArc;
};

export const ARCHETYPE_DATA: Record<BaseType, ArchetypeData> = {
  fortress: {
    tagline:
      `Samotnik ukryty za murem własnych lęków — nie ufa nikomu, bo nie ufa sobie.`,
    tagline_shadow:
      `Twierdza Cienia to mistrz dystansu. Kontroluje przez brak — milczenie, wycofanie, dawkowanie informacji. Nikt nie wie, co myśli. Buduje sieci informacyjne, bo informacja to ochrona. Inni czują zimno.`,
    tagline_light:
      `Twierdza Siły to żywy mur. Chroni się przez dominację — kto się zbliży, ten usłyszy warknięcie. Bezpośrednia, zastraszająca, widoczna. Nie chowa się — stoi na murze i wyzwie cię na pojedynek, zanim zapytasz o imię.`,
    core_desire:
      `Bezpieczeństwo absolutne — świat, w którym nic i nikt nie może go zranić.`,
    core_fear: `Bycia bezbronnym, odsłoniętym, zdanym na łaskę innych.`,
    wound_text:
      `Ktoś, komu ufał — rodzic, mentor, towarzysz broni — zdradził go w momencie, gdy był najbardziej bezbronny. Od tamtej pory zbudował mur. Nie z nienawiści do ludzi, lecz z przekonania, że bliskość to zaproszenie do ciosu.`,
    gift_text:
      `Niezawodność w kryzysie. Kiedy wszyscy panikują, Twierdza działa — trzeźwo, precyzyjnie, bez sentymentu. Drużyna może na niej polegać operacyjnie.`,
    shadow_repression:
      `Nie widzi, że jej mur niszczy relacje, na których jej zależy. Wierzy szczerze, że jest „po prostu ostrożna" — nie widzi, jak bardzo jest samotna. Projektuje własne lęki na innych: „to oni są niegodni zaufania".`,
    shadow_struggle:
      `Wie, że powinna otworzyć się na drużynę — ale za każdym razem, gdy próbuje, słyszy w głowie ostrzeżenie. Łapie się na testowaniu lojalności towarzyszy i nienawidzi się za to.`,
    shadow_integration:
      `Zna swój mur i decyduje świadomie, kiedy go opuścić. Potrafi powiedzieć: „trudno mi ufać, ale spróbuję". Mur stał się narzędziem, nie więzieniem.`,
    conflicts_repression: [
      `Chce ufać drużynie, ale każda oznaka słabości wydaje mu się pułapką.`,
      `Interpretuje troskę jako próbę manipulacji — i sam nie rozumie, czemu go to boli.`,
      `Buduje plan awaryjny ucieczki z każdej sytuacji — nawet z przyjacielskiej kolacji.`,
    ],
    conflicts_struggle: [
      `Wie, że powinien otworzyć się na drużynę — ale za każdym razem, gdy próbuje, słyszy w głowie ostrzeżenie.`,
      `Łapie się na testowaniu lojalności towarzyszy i nienawidzi się za to.`,
      `Chce powiedzieć „potrzebuję pomocy" — ale słowa nie przechodzą przez gardło.`,
    ],
    conflicts_integration: [
      `Wie, że jest trudny w relacjach — i musi decydować, ile wysiłku wkłada w zmianę.`,
      `Potrafi zaufać — ale nie wszędzie i nie wszystkim. Musi wybierać, komu otworzyć bramę.`,
      `Dawny instynkt mówi „uciekaj" — ale nowy głos pyta „a co jeśli zostaną?"`,
    ],
    hooks: [
      `Ktoś z przeszłości — ta sama osoba, która go zdradziła — pojawia się ponownie i prosi o pomoc.`,
      `Drużyna odkrywa, że jedynym sposobem na pokonanie zagrożenia jest zaufanie komuś, kto już raz zawiódł.`,
      `Twierdza musi chronić kogoś, kto przypomina ją samą w przeszłości — zanim zbudowała mur.`,
    ],
    inspirations: [
      `Geralt z Rivii (Wiedźmin — Sapkowski)`,
      `Joel Miller (The Last of Us)`,
      `Jaime Lannister, S1–3 (Gra o Tron)`,
    ],
    narrative_arc_repression: 'awakening',
    narrative_arc_struggle: 'redemption',
    narrative_arc_integration: 'mentor',
  },

  guardian: {
    tagline:
      `Broni innych, bo boi się, że sam nie zasługuje na obronę.`,
    tagline_shadow:
      `Strażnik Cienia chroni z ukrycia. Manipuluje sytuacją tak, żeby drużyna nigdy nie weszła w niebezpieczeństwo — nie pytając jej o zdanie. Zbiera informacje, neutralizuje zagrożenia po cichu, a kiedy ktoś pyta, mówi: „Nie było żadnego zagrożenia".`,
    tagline_light:
      `Strażnik Siły to tarcza na pierwszej linii. Staje między drużyną a niebezpieczeństwem dosłownie — ciałem, głosem, siłą woli. Dowodzi ewakuacją, krzyczy rozkazy, jest ostatni, kto opuści pole bitwy.`,
    core_desire:
      `Bycie potrzebnym — jeśli ludzie mnie potrzebują, nie odejdą.`,
    core_fear: `Bycia porzuconym, uznanym za bezwartościowego, zbędnego.`,
    wound_text:
      `Nie zdołał ochronić kogoś ważnego — brata, córki, całej wioski. Teraz kompensuje, stając się tarczą wszystkich dookoła. Ale pod spodem czai się pytanie: „A jeśli znowu nie wystarczę?"`,
    gift_text:
      `Empatia połączona z czujnością. Strażnik widzi zagrożenie ORAZ ból — jednocześnie. To on zauważy, że ktoś w drużynie ma zły dzień, i to on usłyszy kroki za drzwiami.`,
    shadow_repression:
      `Nie widzi, że jego ochrona to kontrola. Wierzy szczerze, że wszystko robi „z miłości" — nie zauważa, jak bardzo ogranicza wolność chronionych. Kiedy ktoś się buntuje, reaguje zdradzoną miną: „po tym wszystkim, co dla ciebie zrobiłem?"`,
    shadow_struggle:
      `Łapie się na nadopiekuńczości i musi świadomie cofnąć rękę — choć to go boli. Wie, że nie może chronić wszystkich — ale wyobraźnia podsuwa mu katastroficzne scenariusze.`,
    shadow_integration:
      `Rozumie, że jego potrzeba chronienia wynika z lęku, nie z siły. Potrafi powiedzieć: „chcę was chronić — ale nie mam prawa decydować za was". Chroni z szacunkiem, nie z desperacją.`,
    conflicts_repression: [
      `Chroni towarzyszy, ale nie pozwala im podejmować ryzyka — nawet gdy sami tego chcą.`,
      `Wierzy, że wie lepiej, co jest dla drużyny bezpieczne — i nie słyszy ich protestów.`,
      `Kiedy ktoś się rani mimo jego ochrony, czuje nie smutek, lecz wściekłość na siebie.`,
    ],
    conflicts_struggle: [
      `Łapie się na nadopiekuńczości i musi świadomie cofnąć rękę — choć to go boli.`,
      `Wie, że nie może chronić wszystkich — ale wyobraźnia podsuwa mu katastroficzne scenariusze.`,
      `Rozdarty między „pozwól im popełniać błędy" a „to ja ponoszę odpowiedzialność".`,
    ],
    conflicts_integration: [
      `Chroni mądrze — ale musi godzić się z tym, że ochrona nie daje mu prawa do kontroli.`,
      `Potrafi pozwolić towarzyszom ryzykować — choć każda rana ich ciała jest raną jego duszy.`,
      `Wie, że najlepsza ochrona to nauczenie kogoś, jak chronić siebie.`,
    ],
    hooks: [
      `Osoba, którą chroni, uwalnia się spod jego ochrony i wpada w niebezpieczeństwo — ale z własnego wyboru.`,
      `Pojawia się zagrożenie, któremu nie da się zapobiec — tylko towarzyszyć. Strażnik musi nauczyć się być obecny bez kontroli.`,
      `Ktoś spoza drużyny oferuje mu ochronę — i musi zdecydować, czy umie ją przyjąć.`,
    ],
    inspirations: [
      `Samwise Gamgee (Władca Pierścieni)`,
      `Kassandra (Assassin's Creed: Odyssey)`,
      `Molly Weasley (Harry Potter)`,
    ],
    narrative_arc_repression: 'awakening',
    narrative_arc_struggle: 'redemption',
    narrative_arc_integration: 'mentor',
  },

  victim: {
    tagline:
      `Oddaje wszystko, bo wierzy, że tylko poświęcenie daje jej prawo istnieć.`,
    tagline_shadow:
      `Ofiara Cienia poświęca się po cichu — nikt nie widzi ceny, jaką płaci. Milcząca martyrologia. Inni zauważają dopiero, gdy pada ze zmęczenia lub gdy jest za późno.`,
    tagline_light:
      `Ofiara Siły poświęca się z rozmachem — publicznie, widocznie, heroicznie. Wchodzi między smoka a drużynę. Jej poświęcenie jest spektakularne i trudne do zignorowania — ale jest też performansem.`,
    core_desire:
      `Bycia kochaną, docenioną, wartościową w oczach innych.`,
    core_fear: `Bycia nieważną, odrzuconą, niewidzialną, niekochaną.`,
    wound_text:
      `Dorastała w przekonaniu, że miłość trzeba zasłużyć — i że jedyną walutą jest wyrzeczenie. Może to rodzic, który dawał uwagę tylko wtedy, gdy dziecko rezygnowało z własnych potrzeb. Teraz automatycznie wymazuje siebie z równania.`,
    gift_text:
      `Absolutna gotowość do poświęcenia. Kiedy wszystko się rozpada, Ofiara stoi niewzruszenie i mówi: „ja to zrobię". I robi. Jej odwaga jest realna — nawet jeśli motywacja nie jest zdrowa.`,
    shadow_repression:
      `Nie widzi, że jej „altruizm" to mechanizm przetrwania, nie cnota. Reaguje z furią lub bólem, gdy ktoś sugeruje, że nie musi się poświęcać — bo słyszy: „nie jesteś potrzebna".`,
    shadow_struggle:
      `Wie, że powinna powiedzieć „nie" — ale ciało już idzie naprzód, zanim umysł zdąży zaprotestować. Rozpoznaje moment, gdy poświęcenie staje się performansem — i nie wie, co z tą świadomością zrobić.`,
    shadow_integration:
      `Potrafi dać — i odmówić. Rozumie źródło swojej potrzeby poświęcania się i wybiera świadomie, kiedy się poświęcić, a kiedy powiedzieć: „nie, teraz ja". Jej hojność jest prawdziwa, bo jest wolna.`,
    conflicts_repression: [
      `Poświęca się automatycznie — i czuje pustkę, gdy nikt nie zauważy.`,
      `Reaguje wrogością, gdy ktoś mówi „nie musisz tego robić" — słyszy: „nie jesteś potrzebna".`,
      `Porównuje swoje poświęcenia z innymi i czuje urazę, gdy jej wysiłek nie jest „największy".`,
    ],
    conflicts_struggle: [
      `Wie, że powinna powiedzieć „nie" — ale ciało już idzie naprzód, zanim umysł zdąży zaprotestować.`,
      `Czuje gniew na siebie po kolejnym zbyt dalekim poświęceniu — i wstyd za ten gniew.`,
      `Rozpoznaje moment, gdy poświęcenie staje się performansem — i nie wie, co z tą świadomością zrobić.`,
    ],
    conflicts_integration: [
      `Może dać — i może odmówić. Ale odmowa nadal boli, nawet gdy wie, że jest słuszna.`,
      `Musi godzić się z tym, że ludzie czasem nie chcą jej pomocy — i to nie znaczy, że ją odrzucają.`,
      `Uczy się, że „jestem warta" nie wymaga dowodu w postaci poświęcenia.`,
    ],
    hooks: [
      `Drużyna wyraźnie mówi: „nie potrzebujemy twojego poświęcenia — potrzebujemy CIEBIE". Ofiara nie wie, jak to przetworzyć.`,
      `Pojawia się ktoś, kto poświęca się jeszcze bardziej — i Ofiara widzi w nim lustro, które nie podoba jej się.`,
      `Musi podjąć decyzję, która jest egoistyczna, ale obiektywnie słuszna — wybrać siebie dla dobra misji.`,
    ],
    inspirations: [
      `Frodo Baggins (Władca Pierścieni)`,
      `Yennefer z Vengerbergu (Wiedźmin — aspekt poświęcenia)`,
      `Jester Lavorre (Critical Role)`,
    ],
    narrative_arc_repression: 'awakening',
    narrative_arc_struggle: 'redemption',
    narrative_arc_integration: 'mentor',
  },

  mercenary: {
    tagline:
      `Ma swoją cenę i swój kodeks — i jedno z nich kiedyś go zdradzi.`,
    tagline_shadow:
      `Najemnik Cienia to broker informacji, cichociemny, mistrz szarej strefy. Działa z ukrycia, za pośrednikami. Nikt nie wie jego prawdziwego imienia.`,
    tagline_light:
      `Najemnik Siły to otwarty żołnierz fortuny. Negocjuje głośno, walczy z rozmachem, ma reputację i ją pielęgnuje. „Chcesz najlepszego? Oto moja cena."`,
    core_desire:
      `Wolność — życie na własnych warunkach, bez długów i zobowiązań.`,
    core_fear: `Bycia uwięzionym — przez lojalność, obowiązek, uczucia, systemy.`,
    wound_text:
      `Był kiedyś częścią czegoś — zakonu, armii, rodziny. Coś poszło nie tak. Został wykorzystany, zdradzony lub zmuszony do czegoś, czego nie mógł zaakceptować. Od tamtej pory pracuje sam, za złoto, bez sentymentów. Ale kodeks, który sobie stworzył, jest dziwnie szczegółowy — jakby próbował odbudować zasady, które stracił.`,
    gift_text:
      `Klarowność. Najemnik jest jedyną osobą w pokoju, która nie kłamie co do swoich motywacji. „Płacisz — robię. Nie płacisz — odchodzę." Ta uczciwość jest paradoksalnie cenna w świecie pełnym ukrytych agend.`,
    shadow_repression:
      `Nie widzi, że jego cynizm maskuje tęsknotę za przynależnością. Interpretuje każdy gest bliskości drużyny jako „manipulację" lub „sentyment". Kiedy ktoś go rani, mówi: „tak, to potwierdza moje podejście" — nie widząc, że ból dowodzi czegoś odwrotnego.`,
    shadow_struggle:
      `Wie, że mu zależy — i nienawidzi tego. Zależy = zobowiązanie = pułapka. Rozdarty między „odejść teraz, póki mogę" a „zostać i zobaczyć, co będzie".`,
    shadow_integration:
      `Zna swoją cenę — ale zna też swoje serce. Potrafi powiedzieć: „robię to za złoto, ale też dlatego, że mi na was zależy. Nie mówcie nikomu." Wolność przestała być ucieczką — stała się świadomym wyborem.`,
    conflicts_repression: [
      `Insistuje, że drużyna to „umowa" — i denerwuje się, gdy inni traktują go jak przyjaciela.`,
      `Kiedy ktoś okazuje mu lojalność bez powodu, szuka ukrytego motywu.`,
      `Kodeks osobisty staje się coraz bardziej skomplikowany — bo podświadomie szuka wyjątków, żeby zostać.`,
    ],
    conflicts_struggle: [
      `Wie, że mu zależy — i nienawidzi tego. Zależy = zobowiązanie = pułapka.`,
      `Rozdarty między „odejść teraz, póki mogę" a „zostać i zobaczyć, co będzie".`,
      `Łapie się na robieniu rzeczy ZA DARMO dla drużyny i natychmiast znajduje racjonalizację.`,
    ],
    conflicts_integration: [
      `Potrafi przyznać: „zależy mi" — ale musi decydować, ile siebie oddać, nie tracąc wolności.`,
      `Godzi wolność z bliskością — i akceptuje, że to napięcie nigdy całkiem nie zniknie.`,
      `Wie, że jego cynizm był zbroją — ale nadal ją nosi na zewnątrz, z wyboru.`,
    ],
    hooks: [
      `Drużyna jest w długu u kogoś niebezpiecznego — jedyny sposób na spłatę to złamanie kodeksu Najemnika.`,
      `Ktoś oferuje mu „dom" — przystań, przynależność, stałość. Cena: lojalność bez warunków.`,
      `Dawna przeszłość — zakon/armia/rodzina — przysyła wiadomość: „wróć. Wszystko wybaczamy."`,
    ],
    inspirations: [
      `Han Solo (Gwiezdne Wojny)`,
      `Zevran Arainai (Dragon Age: Origins)`,
      `Spike Spiegel (Cowboy Bebop)`,
    ],
    narrative_arc_repression: 'heros_journey',
    narrative_arc_struggle: 'redemption',
    narrative_arc_integration: 'mentor',
  },

  seeker: {
    tagline:
      `Nie wie, kim jest — i dlatego nie może przestać szukać.`,
    tagline_shadow:
      `Poszukiwacz Cienia szuka po cichu — czyta, obserwuje, infiltruje, zbiera fragmenty. Nikt nie wie, czego szuka, bo sam nie jest pewien.`,
    tagline_light:
      `Poszukiwacz Siły szuka głośno — pyta, prowokuje, kwestionuje, debatuje. Wchodzi do sali tronowej i pyta króla: „Ale DLACZEGO?"`,
    core_desire:
      `Tożsamość — zrozumienie, kim naprawdę jest i czemu jest na świecie.`,
    core_fear:
      `Bycia pustym, nieautentycznym, „nikim" pod warstwami masek.`,
    wound_text:
      `Nigdy nie pasował. W rodzinie był obcym, w szkole — dziwadłem, w zakonie — heretykiem. Nie wie, czy to świat jest nie tak, czy on. Zaczął szukać — wiedzy, przygód, siebie — bo stanie w miejscu oznacza konfrontację z pustką w środku.`,
    gift_text:
      `Perspektywa outsidera. Poszukiwacz widzi to, czego insiderzy nie potrafią — ślepe punkty systemów, absurd tradycji, szansę tam, gdzie inni widzą ruinę. Zadaje pytania, których nikt inny nie zadaje.`,
    shadow_repression:
      `Nie widzi, że szukanie stało się ucieczką przed znalezieniem. Wierzy, że następna odpowiedź będzie „tą jedyną" — nie widząc, że pytanie jest ważniejsze od odpowiedzi, i że unika konfrontacji z sobą.`,
    shadow_struggle:
      `Wie, że szukanie stało się ucieczką — ale nie potrafi się zatrzymać. Rozpoznaje momenty autentyczności i chwyta się ich — ale szybko je traci.`,
    shadow_integration:
      `Zaakceptował, że jest poszukiwaczem z natury — i że to OK. Nie potrzebuje „znaleźć" czegokolwiek, żeby mieć wartość. Droga jest celem. Może stać się przewodnikiem dla innych, którzy szukają.`,
    conflicts_repression: [
      `Ciągle rusza w drogę — bo stanie w miejscu oznacza konfrontację z pustką w środku.`,
      `Rozpoczyna sto poszukiwań i nie kończy żadnego — bo odpowiedź mogłaby być rozczarowująca.`,
      `Pyta „kim jestem?" — ale sabotuje każdą odpowiedź, bo żadna nie wydaje się „prawdziwa".`,
    ],
    conflicts_struggle: [
      `Wie, że szukanie stało się ucieczką — ale nie potrafi się zatrzymać.`,
      `Rozpoznaje momenty autentyczności i chwyta się ich — ale szybko je traci.`,
      `Rozdarty między „zaakceptuj, kim jesteś" a „możesz być kimś lepszym".`,
    ],
    conflicts_integration: [
      `Zaakceptował, że droga jest celem — ale musi godzić to z potrzebami drużyny, która chce stabilności.`,
      `Wie, kim jest — ale musi wybierać, ile z siebie pokazać innym.`,
      `Tożsamość nie jest problemem, ale byciem „obcym" pozostaje samotne nawet ze świadomością.`,
    ],
    hooks: [
      `Znajduje odpowiedź, której szukał — i jest prostsza, banalniejsza, mniejsza, niż się spodziewał.`,
      `Ktoś w drużynie mówi: „wiem, kim jesteś" — i opis jest niepokojąco trafny.`,
      `Odkrywa miejsce, które czuje się jak dom — i musi zdecydować, czy zostać, czy iść dalej.`,
    ],
    inspirations: [
      `Kvothe (Imię wiatru — Rothfuss)`,
      `Guts, młody (Berserk)`,
      `Wander (Shadow of the Colossus)`,
    ],
    narrative_arc_repression: 'coming_of_age',
    narrative_arc_struggle: 'mystery',
    narrative_arc_integration: 'mentor',
  },

  mediator: {
    tagline:
      `Buduje mosty między innymi, ale sam stoi na niczyim brzegu.`,
    tagline_shadow:
      `Mediator Cienia pracuje za kulisami — ciche rozmowy, dyskretna dyplomacja, przekazywanie informacji między stronami tak, żeby żadna nie wiedziała o drugiej.`,
    tagline_light:
      `Mediator Siły to publiczny negocjator — staje między armiami, podnosi dłoń i mówi: „DOŚĆ". Charyzma i autorytet moralny jako narzędzia pokoju.`,
    core_desire:
      `Harmonia — świat, w którym konflikty zostają rozwiązane, a ludzie się rozumieją.`,
    core_fear: `Konfliktu, rozłamu, bycia zmuszonym do wybrania strony.`,
    wound_text:
      `Dorastał między walczącymi stronami — rozwodzącymi się rodzicami, wrogimi frakcjami, kłócącym się rodzeństwem. Nauczył się, że jedynym bezpiecznym miejscem jest MIĘDZY — neutralność jako strategia przetrwania. Teraz automatycznie mediuje, nawet gdy nie powinien.`,
    gift_text:
      `Empatia wielostronna. Mediator naprawdę rozumie obie strony konfliktu — nie udaje, nie manipuluje. Potrafi przetłumaczyć wrogie stanowiska na ludzki język.`,
    shadow_repression:
      `Nie widzi, że jego „neutralność" to ucieczka od odpowiedzialności. Wierzy, że jest „ponad konfliktem" — nie widząc, że jest PONIŻEJ niego, schowany przed bólem wybrania strony.`,
    shadow_struggle:
      `Wie, że mediacja to ucieczka od konfrontacji — ale kiedy przestaje mediować, czuje pustkę. Próbuje mieć opinię — i natychmiast czuje wewnętrzny napór, żeby ją wycofać.`,
    shadow_integration:
      `Potrafi mediować I mieć opinię. Buduje mosty, ale wie, na którym brzegu stoi. Może powiedzieć: „rozumiem obie strony — i wybieram tę."`,
    conflicts_repression: [
      `Buduje pokój za cenę własnej opinii — i nie zauważa, że zniknął.`,
      `Kiedy zmuszony do wybrania strony, paraliżuje się — nie z mądrości, lecz ze strachu.`,
      `Absorbuje emocje innych i nie potrafi odróżnić ich od swoich.`,
    ],
    conflicts_struggle: [
      `Wie, że mediacja to ucieczka od konfrontacji — ale kiedy przestaje mediować, czuje pustkę.`,
      `Próbuje mieć opinię — i natychmiast czuje wewnętrzny napór, żeby ją wycofać.`,
      `Rozdarty między „nie mogę nikogo skrzywdzić" a „milczenie też krzywdzi".`,
    ],
    conflicts_integration: [
      `Potrafi mediować i mieć stanowisko — ale musi godzić się z tym, że stanowisko oznacza konflikty.`,
      `Wie, że nie każdy pokój jest sprawiedliwy — i musi wybierać, który pokój jest wart budowania.`,
      `Zaakceptował konflikt jako narzędzie — ale używa go niechętnie.`,
    ],
    hooks: [
      `Dwie strony konfliktu w drużynie zmuszają go do wyboru — nie da się zbudować mostu, gdy sam stoisz po jednej stronie.`,
      `Pojawia się ktoś, kto mediuje LEPIEJ — i Mediator musi odkryć, czym jest poza swoją rolą.`,
      `Pokój, który zbudował, okazuje się niesprawiedliwy — musi go zburzyć lub zaakceptować.`,
    ],
    inspirations: [
      `Tyrion Lannister, S2–4 (Gra o Tron)`,
      `Aang (Avatar: Legenda Aanga)`,
      `Leliana, soft (Dragon Age)`,
    ],
    narrative_arc_repression: 'awakening',
    narrative_arc_struggle: 'redemption',
    narrative_arc_integration: 'mentor',
  },

  conqueror: {
    tagline:
      `Spala wszystko na drodze do celu — łącznie z sobą.`,
    tagline_shadow:
      `Zdobywca Cienia to strateg z ukrycia — buduje imperia przez proxy, manipuluje rynkami, ciągnie za sznurki. Nikt nie wie, że to on stoi za sukcesem (lub ruiną).`,
    tagline_light:
      `Zdobywca Siły to jawny zdobywca — na polu bitwy, w sali tronowej, na arenie. Jego ambicja jest flagą, którą nosi dumnie. „Jestem najlepszy — udowodnię to."`,
    core_desire:
      `Władza, sukces, kontrola — udowodnienie, że jest najlepszy, najsilniejszy, niepokonany.`,
    core_fear: `Bycia słabym, pokonanym, nieistotnym, zapomnianym.`,
    wound_text:
      `Ktoś — rodzic, rywal, system — powiedział mu kiedyś, że jest niczym. Że nigdy niczego nie osiągnie. Każdy kolejny sukces jest odpowiedzią na ten głos. Problem w tym, że głos nigdy nie cichnie, bo mieszka wewnątrz.`,
    gift_text:
      `Siła woli. Kiedy Zdobywca mówi „zrobię to", to zrobi. Drużyna zyskuje silnik, który nigdy nie gaśnie. W kryzysie to on każe wszystkim wstać i iść dalej.`,
    shadow_repression:
      `Nie widzi, że jego ambicja to desperacja. Wierzy, że jest „po prostu lepszy" — nie widząc, że każdy sukces jest krzykiem do kogoś, kto dawno odszedł. Reaguje furią na porażkę, bo porażka odsłania pustkę.`,
    shadow_struggle:
      `Wie, że ludzie nie są zasobami — ale traktuje ich tak, gdy stawka jest wysoka. Po zwycięstwie czuje pustkę zamiast satysfakcji — i natychmiast szuka kolejnego celu.`,
    shadow_integration:
      `Wie, skąd bierze się głód. Nadal jest ambitny — ale ambicja stała się wyborem, nie przymusem. Potrafi przegrać i nie zniknąć. Jego siła jest prawdziwa, bo nie wymaga ciągłego dowodzenia.`,
    conflicts_repression: [
      `Nie widzi, jak bardzo rujnuje relacje w pogoni za celem — i obwinia innych za ich „słabość".`,
      `Każda porażka to atak na tożsamość — reaguje furią, nie refleksją.`,
      `Wierzy, że jest „po prostu ambitny" — nie widząc, że ambicja jest krzykiem.`,
    ],
    conflicts_struggle: [
      `Wie, że ludzie nie są zasobami — ale traktuje ich tak, gdy stawka jest wysoka.`,
      `Po zwycięstwie czuje pustkę zamiast satysfakcji — i natychmiast szuka kolejnego celu.`,
      `Łapie się na momencie: „to nie było tego warte" — i szybko to tłumi.`,
    ],
    conflicts_integration: [
      `Nadal jest ambitny — ale musi decydować, kiedy ambicja służy, a kiedy niszczy.`,
      `Potrafi przegrać bez zniknięcia — ale dawny głód wraca w momentach stresu.`,
      `Zna cenę sukcesu — i musi za każdym razem pytać, czy chce ją zapłacić.`,
    ],
    hooks: [
      `Cel, do którego dążył, okazuje się możliwy — ale za cenę osoby, na której mu zależy (nawet jeśli tego nie przyzna).`,
      `Ktoś młodszy, bardziej utalentowany, szybszy — zagraża jego pozycji. Jak zareaguje?`,
      `Osiąga cel. Wygrywa. I nie czuje nic. Co teraz?`,
    ],
    inspirations: [
      `Walter White (Breaking Bad)`,
      `Arthas Menethil (Warcraft III)`,
      `Griffith (Berserk)`,
    ],
    narrative_arc_repression: 'tragedy',
    narrative_arc_struggle: 'redemption',
    narrative_arc_integration: 'mentor',
  },

  visionary: {
    tagline:
      `Widzi świat, jaki powinien być — i nie cofnie się przed niczym, by go zbudować.`,
    tagline_shadow:
      `Wizjoner Cienia działa przez idee — pisze manifesty, buduje sekretne komórki, wpływa na myślenie. Zmiana przychodzi cicho, przez infiltrację umysłów.`,
    tagline_light:
      `Wizjoner Siły to charyzmatyczny lider — staje przed tłumem i mówi. Ludzie podążają nie ze strachu, lecz dlatego, że on WIDZI to, czego oni nie potrafią. Prorok, reformator, rewolucjonista.`,
    core_desire:
      `Zmiana — przekształcenie świata (lub jego fragmentu) zgodnie z wyraźną wizją.`,
    core_fear:
      `Niemocy, bezsensowności, odkrycia, że wizja była błędem.`,
    wound_text:
      `Zobaczył coś, co go złamało — niesprawiedliwość, ruinę, cierpienie bez sensu. I w tym momencie coś się przełączyło: nie będzie patrzeć. Będzie działać. Problem w tym, że wizja stała się obsesją, a granica między „naprawić świat" a „zmusić świat do posłuszeństwa" jest cieńsza niż myśli.`,
    gift_text:
      `Inspiracja. Wizjoner widzi możliwość tam, gdzie inni widzą koniec. Potrafi zmobilizować ludzi słowem, planem, samą siłą pewności. Drużyna zyskuje kierunek.`,
    shadow_repression:
      `Nie rozróżnia „wizja dla świata" od „wizja dla ego" — i reaguje agresją na krytykę. Wierzy, że cel uświęca środki — i ma coraz dłuższą listę „koniecznych" kompromisów.`,
    shadow_struggle:
      `Wie, że może się mylić — ale ta myśl jest paraliżująca, bo bez wizji nie wie, kim jest. Rozdarty między „słuchaj innych" a „masz wizję — prowadź".`,
    shadow_integration:
      `Wie, że wizja jest jego — nie jedyną. Potrafi powiedzieć: „mogę się mylić — ale nadal uważam, że warto spróbować". Inspiruje, nie żądając posłuszeństwa. Lider, nie tyran.`,
    conflicts_repression: [
      `Nie rozróżnia „wizja dla świata" od „wizja dla ego" — i reaguje agresją na krytykę.`,
      `Wierzy, że cel uświęca środki — i ma coraz dłuższą listę „koniecznych" kompromisów.`,
      `Kiedy wizja nie działa, obwinia ludzi — nie plan.`,
    ],
    conflicts_struggle: [
      `Wie, że może się mylić — ale ta myśl jest paraliżująca, bo bez wizji nie wie, kim jest.`,
      `Rozdarty między „słuchaj innych" a „masz wizję — prowadź".`,
      `Łapie się na mesjanizmie i musi świadomie hamować — co czuje jak zdradę misji.`,
    ],
    conflicts_integration: [
      `Wie, że wizja jest jego — nie jedyną. Ale nadal boli, gdy ludzie idą inną drogą.`,
      `Musi godzić inspirację z wolnością tych, których inspiruje.`,
      `Zaakceptował, że zmiana jest powolna — i musi wybierać, czy cierpliwość to mądrość, czy rezygnacja.`,
    ],
    hooks: [
      `Wizja wymaga poświęcenia jednej osoby z drużyny. Czy cel uświęca środki?`,
      `Ktoś oferuje szybszą drogę do realizacji wizji — ale moralna cena jest wysoka.`,
      `Okazuje się, że wizja opierała się na kłamstwie — nieintencjonalnym, ale kłamstwie. Co dalej?`,
    ],
    inspirations: [
      `Daenerys Targaryen (Gra o Tron)`,
      `Magneto (X-Men)`,
      `Solas (Dragon Age: Inquisition)`,
    ],
    narrative_arc_repression: 'tragedy',
    narrative_arc_struggle: 'redemption',
    narrative_arc_integration: 'mentor',
  },

  savior: {
    tagline:
      `Chce zbawić wszystkich — pytanie, czy pozwoli im się zbawić na własnych warunkach.`,
    tagline_shadow:
      `Zbawca Cienia działa z ukrycia — anonimowy dobrodziej, sekretna pomoc, guardian angel. Ratuje, ale nie chce być widziany. Może dlatego, że nie wierzy, iż zasługuje na wdzięczność.`,
    tagline_light:
      `Zbawca Siły to otwarty krzyżowiec — głosi, walczy, prowadzi kampanię. Paladin, rewolucjonista, prorok. Jego wiara jest flagą i tarczą jednocześnie.`,
    core_desire:
      `Odkupienie — własne lub świata. Wiara, że cierpienie może mieć sens, jeśli prowadzi do dobra.`,
    core_fear:
      `Że cierpienie jest bezcelowe. Że nie da się naprawić. Że zło wygra.`,
    wound_text:
      `Widział upadek — własny lub czyjś — i przysiągł, że to się nie powtórzy. Może sam był kiedyś po złej stronie i szuka odkupienia. Może stracił kogoś, kogo mógł ocalić. Teraz nosi misję jak zbroję — chroni go przed pytaniem, czy sam zasługuje na zbawienie.`,
    gift_text:
      `Wiara. W momencie, gdy wszyscy się poddali, Zbawca wstaje i mówi: „nie. Jest inny sposób." Ta nieugięta wiara w dobro jest zaraźliwa — i może dosłownie zmienić bieg fabuły.`,
    shadow_repression:
      `Nie widzi, że „ratowanie" to kontrola. Wierzy, że jest bezinteresowny — nie widząc, jak desperacko potrzebuje być „tym dobrym". Kiedy ktoś odmawia pomocy, reaguje nie zrozumieniem, lecz furią.`,
    shadow_struggle:
      `Wie, że granica między pomocą a kontrolą jest cienka — i musi ją negocjować codziennie. Czuje wstyd, gdy przyłapie się na potrzebie bycia „tym dobrym" — ale ta potrzeba nie znika.`,
    shadow_integration:
      `Wie, że chce pomagać — i wie, dlaczego. Potrafi zaoferować pomoc i zaakceptować odmowę. Rozumie, że zbawienie to dar, nie zobowiązanie. Jego wiara jest cicha i nieugięta — nie potrzebuje publiczności.`,
    conflicts_repression: [
      `Ratuje ludzi, którzy nie prosili o ratunek — i gniewem reaguje na ich „niewdzięczność".`,
      `Nie widzi, że „pomaganie" to kontrola — bo przyznanie tego zniszczyłoby obraz siebie.`,
      `Potrzebuje ofiar, żeby mieć sens — i podświadomie szuka kryzysów.`,
    ],
    conflicts_struggle: [
      `Wie, że granica między pomocą a kontrolą jest cienka — i musi ją negocjować codziennie.`,
      `Czuje wstyd, gdy przyłapie się na potrzebie bycia „tym dobrym" — ale ta potrzeba nie znika.`,
      `Rozdarty między „powinienem pomóc" a „kto dał mi prawo decydować za nich?"`,
    ],
    conflicts_integration: [
      `Oferuje pomoc i akceptuje odmowę — ale odmowa nadal boli.`,
      `Wie, że zbawienie nie jest jednorazowym aktem — to codzienne wybory, z których nie wszystkie będą słuszne.`,
      `Zaakceptował, że nie może zbawić wszystkich — i musi wybrać, kogo, kiedy i jak.`,
    ],
    hooks: [
      `Osoba, którą próbuje zbawić, nie chce zbawienia — i ma ku temu dobre powody.`,
      `Jedynym sposobem na pomoc jest cofnięcie się i pozwolenie komuś na porażkę. Zbawca musi nic nie robić.`,
      `Dawny „uratowany" wraca — i okazuje się, że ratunek wyrządził mu więcej szkody niż pożytku.`,
    ],
    inspirations: [
      `Gandalf (Władca Pierścieni)`,
      `Andraste (Dragon Age — postać lore)`,
      `Atticus Finch (Zabić drozda)`,
    ],
    narrative_arc_repression: 'awakening',
    narrative_arc_struggle: 'redemption',
    narrative_arc_integration: 'mentor',
  },
};
