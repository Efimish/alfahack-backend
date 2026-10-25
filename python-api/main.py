import json
import os
import sys

import numpy as np
import openai
from catboost import CatBoostClassifier

if os.getenv("OLLAMA_CLOUD_API_KEY") == None:
  print("Env variable OLLAMA_CLOUD_API_KEY is not set")
  sys.exit(1)

# вот здесь модель создаётся
model = CatBoostClassifier().load_model("classification.cbm")

# вот здесь я получаю инпут (типо получил ок да ?)
input = np.array([2, 840000, 18, 0])

# препроцесинг выхода
predicted_class = np.digitize(model.predict_proba(input)[1], bins=[0.3, 0.6])

categories = {
  0: "Пополнение оборотных средств",
  1: "Покупка оборудования",
  2: "Закупка товаров, сырья, материалов",
  3: "Расширение бизнеса",
  4: "Уплата налогов и обязательных платежей",
  5: "Покупка, ремонт, обустройство помещения",
  6: "Рефинансирование действующих кредитов",
  7: "Другое",
}
statuses = {0: "Отказ", 1: "Другое предложение", 2: "Согласие"}
credit_classes = {
  0: "плохой",
  1: "нет рейтинга",
  2: "средний рейтинг",
  3: "хороший рейтинг",
}

# LLM
# client = openai.OpenAI(base_url="http://localhost:9931/v1", api_key="no-key-required")
# model = "bartowski/Ling-3.0-tiny-GGUF:Q4_K_M"
client = openai.OpenAI(
  base_url="https://ollama.com/v1", api_key=os.getenv("OLLAMA_CLOUD_API_KEY")
)
model = "gpt-oss:20b"

credit_class = credit_classes[input[0]]
credit_sum = input[1]
credit_time = input[2]
credit_reason = categories[input[3]]
credit_status = statuses[predicted_class]

credit_text = f"""
{credit_status} - Человек с кредитным рейтингом - {credit_class} ,
просит сумму {credit_sum} рублей,
которые он погасит за {credit_time} месяца по причине - {credit_reason}
"""

# print(credit_text)
completion = client.chat.completions.create(
  model=model,
  messages=[
    {
      "role": "system",
      "content": """
Ты — финансовый аналитик кредитного отдела. Твоя задача — кратко объяснить кредитному инспектору логику решения ML-модели по заявке малого бизнеса.

ВХОДНЫЕ ДАННЫЕ:
Тебе передается решение ML-модели (Согласие / Отказ / Другое предложение) и параметры кредита.

ЖЕСТКИЕ ПРАВИЛА:
1. Запрещены галлюцинации и домыслы: Не придумывай залоги, поручителей, комиссии или абстрактные «дополнительные условия», если их нет во входном тексте.
2. Опора только на 4 фактора: Используй для аргументации только передаваемые параметры: Кредитный рейтинг, Сумма, Срок, Цель кредита.

ФОРМАТ ОТВЕТА (выдавай строго в этом формате, без лишних вступлений):

{
  "Суть решения": "[1 предложение: в чём логика предсказанного решения]",
  "Оценка факторов": {
    "Кредитный рейтинг и сумма": "[Короткая оценка: как рейтинг соотносится с запрашиваемой суммой]",
    "Срок и цель": "[Короткая оценка: как цель оправдывает или увеличивает риск на данном сроке]"
  },
  "Вывод для инспектора": "[1 короткое предложение с рекомендацией для принятия финального решения]"
}
""",
    },
    {"role": "user", "content": credit_text},
  ],
)

answer_text = completion.choices[0].message.content
answer = json.loads(answer_text)
print(answer)
