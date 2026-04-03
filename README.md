# Campaign Layer

Setup techniczny projektu oparty o [`ttrpg-prd.md`](./ttrpg-prd.md). Repo zawiera tylko fundament aplikacji: Next.js 14, Mantine, integrację z Supabase, minimalne PWA, stronę statusową oraz migrację schematu danych. Nie ma tu jeszcze ekranów produktowych z MVP.

## Wymagane teraz

- Konto w `Supabase`
- Konto w `Vercel`
- Repozytorium Git do deployu
- Lokalny plik `.env.local` utworzony na bazie [`.env.example`](./.env.example)

## Opcjonalne później

- `OPENAI_API_KEY` dla sugestii fabularnych i transkrypcji z roadmapy
- `SUPABASE_SERVICE_ROLE_KEY`, jeśli pojawi się backend lub joby wymagające uprawnień poza RLS
- Własny SMTP do maili auth w produkcji

## Co musisz przygotować

| System | Co przygotować | Gdzie to ustawić / wkleić |
| --- | --- | --- |
| Supabase | `Project URL` | `.env.local`, Vercel |
| Supabase | `anon public key` | `.env.local`, Vercel |
| Supabase Auth | Provider `Email` + `Magic Link` | Supabase Dashboard -> Authentication -> Providers |
| Supabase Auth | `Site URL` | Supabase Dashboard -> Authentication -> URL Configuration |
| Supabase Auth | `Redirect URLs` dla `http://localhost:3000`, preview Vercel i domeny produkcyjnej | Supabase Dashboard -> Authentication -> URL Configuration |
| Supabase Storage | Prywatny bucket `recordings` | Supabase Dashboard -> Storage |
| Vercel | Podpięte repo + zmienne środowiskowe z `.env.example` | Vercel -> Project Settings -> Environment Variables |
| GitHub / Git | Repozytorium z kodem | Integracja z Vercel |
| OpenAI | `OPENAI_API_KEY` | `.env.local`, Vercel, dopiero gdy włączysz funkcje AI |

## Zmienne środowiskowe

Skopiuj [`.env.example`](./.env.example) do `.env.local` i uzupełnij:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Opcjonalnie później:

```bash
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

Nigdy nie commituj `.env.local`, `SUPABASE_SERVICE_ROLE_KEY` ani żadnych prywatnych credentiali.

## Supabase: migracje i storage

Repo zawiera migrację SQL:

- [`supabase/migrations/20260403181000_initial_schema.sql`](./supabase/migrations/20260403181000_initial_schema.sql)

Przykładowy przepływ z CLI:

```bash
npx supabase@latest login
npx supabase@latest link --project-ref <twoj-project-ref>
npx supabase@latest db push
```

Bucket `recordings` jest też opisany w migracji, ale jeśli wolisz zrobić to ręcznie w panelu:

1. Wejdź do `Storage`.
2. Utwórz bucket `recordings`.
3. Ustaw go jako `private`.

## Lokalny start

```bash
npm install
npm run dev
```

Po uruchomieniu pod `http://localhost:3000` zobaczysz prostą stronę główną z:

- listą tego, co setup już przygotowuje,
- testowym przyciskiem Mantine potwierdzającym działanie design systemu.

## Deploy na Vercel

1. Podłącz repozytorium do Vercel.
2. Ustaw zmienne z [`.env.example`](./.env.example) w `Production` i `Preview`.
3. Ustaw poprawne `Redirect URLs` w Supabase Auth dla preview i produkcji.
4. Wdróż projekt.

## Uwagi bezpieczeństwa

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` jest kluczem publicznym i może być używany po stronie klienta.
- Bezpieczeństwo danych ma opierać się na `Row Level Security`, nie na ukrywaniu klucza `anon`.
- Pola GM-only i player-facing projections wymagają docelowo bezpiecznych widoków lub RPC po stronie Supabase.
