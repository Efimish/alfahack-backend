# Альфа-Будущее — бэкенд заявок на кредит

Два сервиса, связанных через Docker Compose:

```
клиент ──> node-api (публичный REST, Postgres)
                │  POST /assess + X-Internal-Api-Key
                ▼
           python-api (внутренний, без published ports)
             CatBoost + LLM (Ollama Cloud)
```

- `node-api` — Elysia + Drizzle + PostgreSQL. Публичный API заявок, хранит
  заявки и результат ML/LLM-оценки.
- `python-api` — FastAPI. Считает риск через CatBoost и генерирует объяснение
  для кредитного инспектора через LLM. Доступен только внутри Docker-сети.

## Быстрый старт

```bash
cp .env.example .env
# заполните POSTGRES_PASSWORD, INTERNAL_API_KEY и OLLAMA_CLOUD_API_KEY
docker compose up --build
```

- API: <http://127.0.0.1:3000>
- Swagger / Scalar: <http://127.0.0.1:3000/>
- OpenAPI JSON: <http://127.0.0.1:3000/json>
- Healthcheck: <http://127.0.0.1:3000/health>

Миграции Postgres применяются автоматически при старте `node-api`
(`pnpm db:migrate` ждёт готовности базы). Если база уже была создана вручную
через `pnpm db:push`, удалите volume (`docker compose down -v`) или продолжайте
использовать `db:push`: файловые миграции рассчитаны на пустую БД.

> Модель обучена на синтетическом датасете и не предназначена для принятия
> реальных кредитных решений.

## Переменные окружения

| Переменная              | Где используется     | Описание                                                  |
| ----------------------- | -------------------- | --------------------------------------------------------- |
| `PORT`                  | node-api             | Порт публичного API (по умолчанию `3000`)                 |
| `POSTGRES_PASSWORD`     | postgres, node-api   | Пароль Postgres                                           |
| `DATABASE_URL`          | node-api локально    | Полный URL БД для запуска без Docker                      |
| `PYTHON_API_URL`        | node-api             | URL Python-сервиса (в compose — `http://python-api:8000`) |
| `PYTHON_API_TIMEOUT_MS` | node-api             | Таймаут запроса к ML/LLM (по умолчанию `45000`)           |
| `INTERNAL_API_KEY`      | node-api, python-api | Общий секрет для внутреннего API                          |
| `OLLAMA_CLOUD_API_KEY`  | python-api           | Ключ Ollama Cloud                                         |
| `OLLAMA_BASE_URL`       | python-api           | По умолчанию `https://ollama.com/v1`                      |
| `OLLAMA_MODEL`          | python-api           | По умолчанию `gpt-oss:20b`                                |

> `compose.yaml` собирает `DATABASE_URL` из `POSTGRES_PASSWORD` самостоятельно:
> Docker Compose не раскрывает `${...}` внутри значений из `.env`.

## Публичный API (node-api)

- `POST /requests` — подать заявку. Заявка сохраняется, затем синхронно
  запрашивается оценка в `python-api`; статус и `assessment` обновляются.
  Если Python-сервис недоступен, заявка **не теряется** — она сохраняется со
  статусом `Повторная проверка`, а `assessment` остаётся `null`.
- `GET /requests` — список заявок (новые первыми).
- `GET /requests/:id` — заявка по ID (`404`, если не найдена).
- `GET /health` — healthcheck.

Тестовые заявки (если таблица пуста): `cd node-api && pnpm db:seed`.

## Локальная разработка без Docker

```bash
# node-api
cd node-api
pnpm install
pnpm db:migrate
pnpm dev

# python-api (в отдельном терминале)
cd python-api
uv sync --locked
uv run --env-file ../.env uvicorn main:app --host 0.0.0.0 --port 8000
```

Для локального запуска `node-api` нужен доступный Postgres и `DATABASE_URL` в
корневом `.env`. `PYTHON_API_URL` по умолчанию — `http://127.0.0.1:8000`.
