# University Schedule — Plan Zajęć

## Wstęp

Projekt ten ma na celu umożliwić sprawne i intuincyjne zarządzanie planami zajęć na uczelni. Jest przeznaczony zarówno dla studentów, prowadzących jak i pracowników uczelni układających plany (planistów). Każdy z tych typów użytkowników ma dostęp do dedykowanego panelu i posiada odpowiednie uprawnienia. 

## Użytkownicy, uprawnienia i przykładowe dane
<img width="1867" height="936" alt="image" src="https://github.com/user-attachments/assets/fbc607ac-3fcf-47f1-ba17-7dc2ca65a0c4" />
Student posiada uprawnienia do przeglądania swojego planu, eksportu go do pliku csv oraz do wyszukania w swoim planie zajęć prowadzonych przez danego prowadzącego.
 <br>
 <br>
<img width="1883" height="952" alt="image" src="https://github.com/user-attachments/assets/5f8d01f0-9a2c-42b3-b694-6db7ce49abb4" />
Prowadzący tak samo jak student posiada uprawnienia do przeglądania własnego planu wraz z eksportem do csv. Ma również dostęp do wyszukiwarki wolnych sal w podanych godzinach oraz może przeglądać listę prowadzących
 <br>
 <br>
<img width="1866" height="962" alt="image" src="https://github.com/user-attachments/assets/c9f64ad2-1f64-4976-b524-6026bf64f9b8" />
Planista ma uprawnienia CRUD do tabel zawierających: Przedmioty, Sale wykładowe, Grupy studenckie, Pracowników, Plany. Może ponadto importować bądź eksportować dane z tych tabel do pliku csv. 
 <br>
 <br>
Ponadto wszyscy zalogowani użytkownicy mogą zmienić swoje hasło. 

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
