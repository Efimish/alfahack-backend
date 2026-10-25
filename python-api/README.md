# python-api

Внутренний сервис оценки кредитных заявок. Не публикует порт наружу: вызывается
только из `node-api` по адресу `http://python-api:8000`.

## Что делает

1. Принимает финансовые показатели и параметры кредита.
2. Определяет кредитный класс (если он не передан) по простой эвристике на
   основе прибыли, выручки и долговой нагрузки.
3. Считает вероятность классов риска моделью CatBoost
   (`classification.cbm`).
4. Просит LLM коротко объяснить решение для кредитного инспектора.

Если LLM недоступен или вернул некорректный JSON, сервис все равно отвечает
200: решение ML остается, а объяснение подставляется детерминированное
(`explanationSource: "fallback"`).

## Запуск

```bash
uv sync --locked
uv run --env-file ../.env uvicorn main:app --host 0.0.0.0 --port 8000
```

Docker:

```bash
docker compose up --build python-api
```

## Переменные окружения

| Переменная | Обязательна | По умолчанию |
| --- | --- | --- |
| `INTERNAL_API_KEY` | да | — |
| `OLLAMA_CLOUD_API_KEY` | да | — |
| `OLLAMA_BASE_URL` | нет | `https://ollama.com/v1` |
| `OLLAMA_MODEL` | нет | `gpt-oss:20b` |
| `MODEL_PATH` | нет | `classification.cbm` |
| `LLM_TIMEOUT_SECONDS` | нет | `30` |
| `LLM_MAX_RETRIES` | нет | `0` |

## API

- `GET /health` — без авторизации.
- `POST /assess` — требует заголовок `X-Internal-Api-Key`.

Пример запроса:

```bash
curl -X POST http://127.0.0.1:8000/assess \
  -H 'Content-Type: application/json' \
  -H "X-Internal-Api-Key: $INTERNAL_API_KEY" \
  -d '{
    "requestId": "11111111-1111-4111-8111-111111111111",
    "financials": {
      "annualRevenue": 10000000,
      "netProfit": 1500000,
      "workingCapital": 3000000,
      "debtBurden": 1000000
    },
    "financing": {
      "purpose": "Пополнение оборотных средств",
      "requestedAmount": 840000,
      "termMonths": 18
    }
  }'
```

Пример ответа:

```json
{
  "requestId": "11111111-1111-4111-8111-111111111111",
  "decision": "approve",
  "status": "Одобрена",
  "creditClass": 3,
  "creditClassSource": "heuristic",
  "riskClass": 2,
  "confidence": 0.92,
  "probabilities": {
    "reject": 0.0002,
    "alternative": 0.0797,
    "approve": 0.9200
  },
  "explanation": {
    "summary": "...",
    "factors": {
      "creditRatingAndAmount": "...",
      "termAndPurpose": "..."
    },
    "recommendation": "..."
  },
  "explanationSource": "llm"
}
```

## Ограничения

- `creditClass` в публичной заявке отсутствует, поэтому сейчас он вычисляется
  эвристикой. Когда появится интеграция с кредитным бюро, значение можно
  передавать в поле `creditClass` — контракт API менять не придется.
- CatBoost-модель обучена на синтетическом `data.csv` (см. `train.py`) и не
  предназначена для реальных кредитных решений.
- Оценка выполняется синхронно внутри `POST /requests`; при необходимости
  LLM-вызов можно вынести в очередь.
