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
| Student    | `t.gasinski@student.pl`      |

## Zatrzymanie projektu

```bash
docker-compose down
```

> **Uwaga:** Użycie `docker-compose down -v` usunie również bazę danych i wszystkie dane zostaną zresetowane do wartości domyślnych.