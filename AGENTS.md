# Agent Instructions

Po każdym ukończonym zadaniu zakończ odpowiedź sekcją `Krótka ścieżka testowa`.

## Wymagania

- Sekcja ma być bardzo krótka: zwykle `3-6` kroków.
- Każdy krok ma mówić:
  - gdzie wejść
  - w co kliknąć lub co wpisać
  - co powinno być widoczne na końcu
- Trzeba objąć wszystkie miejsca zmienione w zadaniu, które da się sprawdzić manualnie.
- Preferuj nazwy ekranów, zakładek, przycisków, drawerów, formularzy i konkretne ścieżki typu `/campaign/123`.
- Pisz po polsku, chyba że użytkownik poprosi inaczej.
- Nie zamieniaj tego w długi plan QA ani listę edge case'ów.

## Format

```md
Krótka ścieżka testowa
1. Wejdź w `...`.
2. Kliknij `...` i sprawdź, że `...`.
3. Przejdź do `...` i upewnij się, że `...`.
```

## Gdy brak UI

Jeśli zmiana nie ma oczywistego entry pointu w UI, podaj najkrótszą możliwą ścieżkę manualnej weryfikacji:
- ekran admina
- strona statusowa
- konkretny rekord testowy
- endpoint lub akcja, której efekt użytkownik może zobaczyć
