## Uruchamianie projektu

Nie ma potrzeby instalowania pythona, ani PostgreSQL.

1. Upewnij się, że posiadasz zainstalowanego [Docker Desktop](https://www.docker.com/products/docker-desktop/).
2. Otwórz terminal w folderze, do którego pobrano ten projekt z GitHuba i wpisz:

```bash
docker-compose build
docker-compose up -d
```

Aby korzystać z aplikacji, wystarczy wejść w przeglądarkę pod adres:
`http://localhost:8000`