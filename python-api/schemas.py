"""Pydantic models shared by the internal assessment endpoint."""

from enum import Enum
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

# numeric(14,2) в Postgres node-api: 12 цифр до запятой и 2 после.
MAX_MONEY = 999_999_999_999.99


def _to_camel(value: str) -> str:
  head, *tail = value.split("_")
  return head + "".join(part.capitalize() for part in tail)


class ApiModel(BaseModel):
  """Base model with camelCase JSON and strict/unknown-field handling."""

  model_config = ConfigDict(
    alias_generator=_to_camel,
    populate_by_name=True,
    extra="forbid",
  )


class FinancingPurpose(str, Enum):
  WORKING_CAPITAL = "Пополнение оборотных средств"
  EQUIPMENT = "Покупка оборудования"
  GOODS = "Закупка товаров, сырья, материалов"
  EXPANSION = "Расширение бизнеса"
  TAXES = "Уплата налогов и обязательных платежей"
  PREMISES = "Покупка, ремонт, обустройство помещения"
  REFINANCING = "Рефинансирование действующих кредитов"
  OTHER = "Другое"


class Financials(ApiModel):
  annual_revenue: float = Field(
    ge=0, le=MAX_MONEY, description="Выручка за последний год"
  )
  net_profit: float = Field(
    ge=-MAX_MONEY,
    le=MAX_MONEY,
    description="Чистая прибыль (может быть отрицательной)",
  )
  working_capital: float = Field(
    ge=-MAX_MONEY, le=MAX_MONEY, description="Оборотные средства"
  )
  debt_burden: float = Field(
    ge=0, le=MAX_MONEY, description="Кредитная нагрузка"
  )


class Financing(ApiModel):
  purpose: FinancingPurpose
  requested_amount: float = Field(gt=0, le=MAX_MONEY)
  term_months: int = Field(gt=0, le=360)


class AssessmentRequest(ApiModel):
  request_id: UUID | None = Field(
    default=None,
    description="ID заявки в node-api (для трассировки)",
  )
  financials: Financials
  financing: Financing
  credit_class: int | None = Field(
    default=None,
    ge=0,
    le=3,
    description="Кредитный класс из внешнего источника. Если не задан, вычисляется эвристикой.",
  )


class Decision(str, Enum):
  APPROVE = "approve"
  ALTERNATIVE = "alternative"
  REJECT = "reject"


class RequestStatus(str, Enum):
  APPROVED = "Одобрена"
  ALTERNATIVE = "Предложены другие условия"
  REJECTED = "Отклонена"


class Probabilities(ApiModel):
  reject: float
  alternative: float
  approve: float


class FactorAssessment(ApiModel):
  credit_rating_and_amount: str
  term_and_purpose: str


class Explanation(ApiModel):
  summary: str
  factors: FactorAssessment
  recommendation: str


class AssessmentResponse(ApiModel):
  request_id: UUID | None
  decision: Decision
  status: RequestStatus
  credit_class: int = Field(ge=0, le=3)
  credit_class_source: Literal["provided", "heuristic"]
  risk_class: int = Field(ge=0, le=2)
  confidence: float = Field(ge=0, le=1)
  probabilities: Probabilities
  explanation: Explanation
  explanation_source: Literal["llm", "fallback"]


class HealthResponse(ApiModel):
  status: Literal["ok"]
