# University Schedule — Plan Zajęć

## Uruchamianie projektu

Nie ma potrzeby instalowania Pythona ani PostgreSQL — wystarczy Docker.

1. Upewnij się, że posiadasz zainstalowanego [Docker Desktop](https://www.docker.com/products/docker-desktop/).
2. Otwórz terminal w folderze projektu i wpisz:

```bash
docker-compose build
docker-compose up -d
```

3. Wejdź w przeglądarce pod adres: `http://localhost:8000`

## Dane do logowania

Domyślne hasło dla wszystkich kont: **`password`**

| Rola       | Email                        |
|------------|------------------------------|
| Planista   | `planista@uczelnia.pl`       |
| Wykładowca | `p.nowak@uczelnia.pl`        |
| Wykładowca | `a.wisniewski@uczelnia.pl`   |
| Wykładowca | `m.zajac@uczelnia.pl`        |
| Wykładowca | `e.krawczyk@uczelnia.pl`     |
| Student    | `t.gasinski@student.pl`      |
| Student    | `v.nikonenko@student.pl`     |
| Student    | `m.kowalczyk@student.pl`     |

## Rozwiązywanie problemów

### Logowanie nie działa / baza jest pusta

Jeśli w logach Dockera pojawia się komunikat:
```
PostgreSQL Database directory appears to contain a database; Skipping initialization
```
oznacza to, że Docker wykrył stary wolumen z poprzedniego uruchomienia i pominął inicjalizację bazy danych. Rozwiązanie:

```bash
docker-compose down -v
docker-compose up -d
```

> **Uwaga:** Flaga `-v` usuwa wolumen bazy danych — wszelkie zmiany wprowadzone ręcznie do bazy zostaną utracone i baza wróci do danych domyślnych.
| Student    | `t.gasinski@student.pl`      |

## Zatrzymanie projektu

```bash
docker-compose down
```
```

> **Uwaga:** Użycie `docker-compose down -v` usunie również bazę danych i wszystkie dane zostaną zresetowane do wartości domyślnych.
