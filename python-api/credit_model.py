"""CatBoost scoring for a credit application."""

from dataclasses import dataclass
from pathlib import Path

import numpy as np
from catboost import CatBoostClassifier

from schemas import (
  AssessmentRequest,
  Decision,
  Financials,
  FinancingPurpose,
  Probabilities,
  RequestStatus,
)

# Порядок целей соответствует порядку, в котором модель обучалась (train.py).
PURPOSE_INDEX: dict[FinancingPurpose, int] = {
  FinancingPurpose.WORKING_CAPITAL: 0,
  FinancingPurpose.EQUIPMENT: 1,
  FinancingPurpose.GOODS: 2,
  FinancingPurpose.EXPANSION: 3,
  FinancingPurpose.TAXES: 4,
  FinancingPurpose.PREMISES: 5,
  FinancingPurpose.REFINANCING: 6,
  FinancingPurpose.OTHER: 7,
}

CREDIT_CLASS_LABELS = {
  0: "плохой",
  1: "низкий",
  2: "средний",
  3: "хороший",
}

RISK_CLASS_TO_DECISION = {
  0: Decision.REJECT,
  1: Decision.ALTERNATIVE,
  2: Decision.APPROVE,
}

RISK_CLASS_TO_STATUS = {
  0: RequestStatus.REJECTED,
  1: RequestStatus.ALTERNATIVE,
  2: RequestStatus.APPROVED,
}


@dataclass(frozen=True)
class ModelResult:
  credit_class: int
  credit_class_source: str
  risk_class: int
  confidence: float
  probabilities: Probabilities

  @property
  def decision(self) -> Decision:
    return RISK_CLASS_TO_DECISION[self.risk_class]

  @property
  def status(self) -> RequestStatus:
    return RISK_CLASS_TO_STATUS[self.risk_class]


def estimate_credit_class(financials: Financials) -> int:
  """Approximate a credit rating from the data available in the application.

  This is a temporary replacement for an external credit bureau score. The
  resulting value (0..3) is fed to the model and returned to node-api, so the
  source can later be switched without changing the API contract.
  """

  if financials.annual_revenue <= 0:
    return 0

  profit_margin = financials.net_profit / financials.annual_revenue
  debt_ratio = financials.debt_burden / financials.annual_revenue

  if financials.net_profit <= 0 or debt_ratio > 0.8:
    return 0
  if debt_ratio > 0.5 or profit_margin < 0.03:
    return 1
  if profit_margin >= 0.12 and debt_ratio <= 0.25:
    return 3
  return 2


class CreditModel:
  """Loaded CatBoost model. Instantiated once during application startup."""

  def __init__(self, model_path: Path) -> None:
    if not model_path.is_file():
      raise FileNotFoundError(f"Model file not found: {model_path}")
    self._model = CatBoostClassifier().load_model(str(model_path))

  def assess(self, request: AssessmentRequest) -> ModelResult:
    if request.credit_class is None:
      credit_class = estimate_credit_class(request.financials)
      credit_class_source = "heuristic"
    else:
      credit_class = request.credit_class
      credit_class_source = "provided"

    features = np.array(
      [
        [
          credit_class,
          request.financing.requested_amount,
          request.financing.term_months,
          PURPOSE_INDEX[request.financing.purpose],
        ]
      ],
      dtype=np.float64,
    )

    raw_probabilities = self._model.predict_proba(features)[0]
    by_class = {
      int(risk_class): float(probability)
      for risk_class, probability in zip(
        self._model.classes_, raw_probabilities, strict=True
      )
    }

    probabilities = Probabilities(
      reject=by_class.get(0, 0.0),
      alternative=by_class.get(1, 0.0),
      approve=by_class.get(2, 0.0),
    )
    risk_class = max(by_class, key=lambda cls: by_class[cls])
    confidence = {
      0: probabilities.reject,
      1: probabilities.alternative,
      2: probabilities.approve,
    }[risk_class]

    return ModelResult(
      credit_class=credit_class,
      credit_class_source=credit_class_source,
      risk_class=risk_class,
      confidence=confidence,
      probabilities=probabilities,
    )
