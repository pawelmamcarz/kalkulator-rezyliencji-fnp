# SafeScript: notatka dla agentów

To nie jest zależność runtime kalkulatora. Publiczny UI FNP nie używa SafeScript i nie powinien być pod niego przepisywany.

SafeScript oznacza tu przyszłą, agentową obudowę kontroli, nie nową warstwę produktu. Jev może później oceniać, czy proponowany krok (audyt, commit, wdrożenie) jest jasny, do przeglądu, albo do blokady. Decyzję i tak wykonuje kod albo człowiek.

## Co już jest twarde

Te polecenia pozostają bramkami bez modelu:

```bash
npm test
npm run lint
npm run build
```

One strzegą kontraktu liczbowego, braku HiGHS w bundlu i renderu. Jev ich nie zastępuje.

## Co może owinąć SafeScript później

1. `npm run jev:audit -- --dry-run` zawsze, bez klucza.
2. `npm run jev:audit` tylko gdy `TYPESAFE_API_KEY` jest w środowisku agenta albo CI, nigdy w Vite `define` i nigdy w przeglądarce.
3. Opcjonalne Choice Jev przed `npm run deploy`: `allow` / `review` / `block` na podstawie diffu tekstów metodologii i wyniku `jev:audit`.
4. Przy braku klucza: pominąć żywy audyt, nie udawać zielonego werdyktu Jev.
5. Przy `review` albo `block`: zatrzymać wdrożenie i pokazać raport, zamiast „naprawiać” priory pod wynik.

Szkic decyzji, nie implementacja:

```text
state: { diff, jevReport, tests: "green"|"red" }
questions:
  deploy: choice(allow, review, block)
  needs_human: noul(...)
```

Nie dodawaj `@typesafe-ai/sdk` ani SafeScript do `dependencies` aplikacji. HTTP albo opcjonalne `devDependency` wystarcza po stronie Node.

Klucz: wyłącznie `TYPESAFE_API_KEY`. Nie zapisuj go w repozytorium, w `public/` ani w Workerze Cloudflare tej strony.
