"""LLM-generated explanations for ML credit decisions."""

import json
import logging
import re

from openai import AsyncOpenAI
from pydantic import BaseModel, Field

from credit_model import CREDIT_CLASS_LABELS, ModelResult
from schemas import (
  AssessmentRequest,
  Explanation,
  FactorAssessment,
)
from settings import Settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """
Ты — финансовый аналитик кредитного отдела. Твоя задача — кратко объяснить кредитному инспектору логику решения ML-модели по заявке малого бизнеса.

ВХОДНЫЕ ДАННЫЕ:
Тебе передается решение ML-модели (Согласие / Отказ / Другое предложение) и параметры кредита.

ЖЕСТКИЕ ПРАВИЛА:
1. Запрещены галлюцинации и домыслы: Не придумывай залоги, поручителей, комиссии или абстрактные «дополнительные условия», если их нет во входном тексте.
2. Опора только на 4 фактора: Используй для аргументации только передаваемые параметры: Кредитный рейтинг, Сумма, Срок, Цель кредита.
3. Не меняй решение ML-модели и не выдумывай числа.
4. Верни только валидный JSON без markdown-оберток.

ФОРМАТ ОТВЕТА (строго в этом формате, без лишних вступлений):

{
  "Суть решения": "[1 предложение: в чём логика предсказанного решения]",
  "Оценка факторов": {
    "Кредитный рейтинг и сумма": "[Короткая оценка: как рейтинг соотносится с запрашиваемой суммой]",
    "Срок и цель": "[Короткая оценка: как цель оправдывает или увеличивает риск на данном сроке]"
  },
  "Вывод для инспектора": "[1 короткое предложение с рекомендацией для принятия финального решения]"
}
""".strip()


class _LlmFactors(BaseModel):
  credit_rating_and_amount: str = Field(alias="Кредитный рейтинг и сумма")
  term_and_purpose: str = Field(alias="Срок и цель")


class _LlmExplanation(BaseModel):
  summary: str = Field(alias="Суть решения")
  factors: _LlmFactors = Field(alias="Оценка факторов")
  recommendation: str = Field(alias="Вывод для инспектора")


def _extract_json(text: str) -> dict:
  text = text.strip()
  fenced = re.fullmatch(
    r"```(?:json)?\s*(.*?)\s*```", text, flags=re.DOTALL | re.IGNORECASE
  )
  if fenced:
    text = fenced.group(1)

  start, end = text.find("{"), text.rfind("}")
  if start == -1 or end < start:
    raise ValueError("LLM response does not contain a JSON object")
  return json.loads(text[start : end + 1])


def _fallback_explanation(
  request: AssessmentRequest, result: ModelResult
) -> Explanation:
  purpose = request.financing.purpose.value
  amount = f"{request.financing.requested_amount:,.0f}".replace(",", " ")
  credit_label = CREDIT_CLASS_LABELS[result.credit_class]

  return Explanation(
    summary=(
      f"ML-модель рекомендует решение «{result.status.value}» на основе "
      "кредитного класса, суммы, срока и цели заявки."
    ),
    factors=FactorAssessment(
      credit_rating_and_amount=(
        f"Кредитный класс {result.credit_class} ({credit_label}) "
        f"при запрашиваемой сумме {amount} ₽."
      ),
      term_and_purpose=(
        f"Срок {request.financing.term_months} мес. и цель «{purpose}» "
        "учтены моделью при оценке риска."
      ),
    ),
    recommendation=(
      "Решение носит рекомендательный характер; окончательное решение "
      "принимает кредитный инспектор."
    ),
  )


class Explainer:
  """Calls the LLM and always returns a usable explanation."""

  def __init__(self, settings: Settings) -> None:
    self._model = settings.ollama_model
    self._client = AsyncOpenAI(
      base_url=settings.ollama_base_url,
      api_key=settings.ollama_api_key,
      timeout=settings.llm_timeout_seconds,
      max_retries=settings.llm_max_retries,
    )

  async def close(self) -> None:
    await self._client.close()

  async def explain(
    self, request: AssessmentRequest, result: ModelResult
  ) -> tuple[Explanation, str]:
    user_prompt = self._build_prompt(request, result)

    try:
      completion = await self._client.chat.completions.create(
        model=self._model,
        messages=[
          {"role": "system", "content": SYSTEM_PROMPT},
          {"role": "user", "content": user_prompt},
        ],
        temperature=0.2,
        response_format={"type": "json_object"},
      )
      content = completion.choices[0].message.content
      if not content:
        raise ValueError("LLM returned an empty response")

      parsed = _LlmExplanation.model_validate(_extract_json(content))
      explanation = Explanation(
        summary=parsed.summary,
        factors=FactorAssessment(
          credit_rating_and_amount=parsed.factors.credit_rating_and_amount,
          term_and_purpose=parsed.factors.term_and_purpose,
        ),
        recommendation=parsed.recommendation,
      )
      return explanation, "llm"
    except Exception:
      logger.exception("LLM explanation failed; using deterministic fallback")
      return _fallback_explanation(request, result), "fallback"

  @staticmethod
  def _build_prompt(request: AssessmentRequest, result: ModelResult) -> str:
    amount = f"{request.financing.requested_amount:,.0f}".replace(",", " ")
    return (
      f"Решение ML: {result.status.value}\n"
      f"Кредитный класс: {result.credit_class} "
      f"({CREDIT_CLASS_LABELS[result.credit_class]})\n"
      f"Сумма: {amount} ₽\n"
      f"Срок: {request.financing.term_months} мес.\n"
      f"Цель: {request.financing.purpose.value}"
    )
