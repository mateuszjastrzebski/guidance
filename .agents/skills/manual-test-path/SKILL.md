---
name: manual-test-path
description: Add a very short manual test path after each completed task so the user can quickly click through every changed area and confirm the result.
metadata:
  author: local
  version: "1.0.0"
---

# Manual Test Path

Use this skill at the end of implementation work when the user needs a short manual verification path.

## Goal

After every completed task, include a section named `Krótka ścieżka testowa`.

The section should help the user quickly:
- open each place affected by the change
- click through the changed flow
- confirm the expected visible result

## Rules

- Keep it short: usually `3-6` steps.
- Cover every changed surface that the user can manually inspect.
- Prefer concrete routes, labels, buttons, tabs, drawers, and forms over generic wording.
- Each step should contain an action and an expected result.
- Write in Polish unless the user asked for another language.
- Do not describe implementation details in this section.
- Do not turn it into a QA plan, edge-case matrix, or automated test report.

## Default Format

```md
Krótka ścieżka testowa
1. Wejdź w `...` i otwórz `...`.
2. Kliknij `...` i sprawdź, że `...`.
3. Przejdź do `...` i upewnij się, że `...`.
```

## Heuristics

- For UI changes: list the exact screens and clicks.
- For form changes: include one happy-path submission.
- For navigation changes: include where to enter and where the user should land.
- For visibility/permissions changes: include both the place where something should appear and where it should stay hidden.
- For backend-only changes with no visible UI: point to the smallest manual check available, such as a status page, dashboard, seeded record, admin screen, or API response preview.
- If a change affects multiple areas, mention each area once instead of repeating shared setup steps.

## Good Example

```md
Krótka ścieżka testowa
1. Wejdź w `/dashboard` i otwórz kampanię testową.
2. Przejdź do zakładki `NPC`, kliknij `Dodaj NPC`, wpisz nazwę i zapisz.
3. Sprawdź, że nowy NPC pojawia się na liście oraz po odświeżeniu strony nadal tam jest.
```

## Bad Example

- Too vague: "Przeklikaj dashboard i zobacz czy działa."
- Too long: ten or more steps with many branches.
- Too technical: steps focused on files, hooks, or SQL instead of manual inspection.
