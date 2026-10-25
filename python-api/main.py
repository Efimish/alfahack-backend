"""Internal FastAPI service: ML scoring + LLM explanation of credit applications.

The service is not published outside the Docker network. node-api calls it with
a shared secret in the X-Internal-Api-Key header.
"""

import logging
import secrets
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, FastAPI, Header, HTTPException, Request, status
from fastapi.responses import JSONResponse

from credit_model import CreditModel
from explainer import Explainer
from schemas import AssessmentRequest, AssessmentResponse, HealthResponse
from settings import settings

logging.basicConfig(
  level=logging.INFO,
  format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def require_internal_key(
  x_internal_api_key: Annotated[
    str | None, Header(alias="X-Internal-Api-Key")
  ] = None,
) -> None:
  if not x_internal_api_key or not secrets.compare_digest(
    x_internal_api_key.encode(), settings.internal_api_key.encode()
  ):
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Invalid internal API key",
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
  logger.info("Loading CatBoost model from %s", settings.model_path)
  app.state.credit_model = CreditModel(settings.model_path)
  app.state.explainer = Explainer(settings)
  logger.info("Service is ready")
  try:
    yield
  finally:
    await app.state.explainer.close()


app = FastAPI(
  title="Alfa Future — internal assessment API",
  version="0.1.0",
  lifespan=lifespan,
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
  logger.exception("Unhandled error while processing %s", request.url.path)
  return JSONResponse(
    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    content={"detail": "Internal server error"},
  )


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
  return HealthResponse(status="ok")


@app.post(
  "/assess",
  response_model=AssessmentResponse,
  dependencies=[Depends(require_internal_key)],
)
async def assess(payload: AssessmentRequest, request: Request) -> AssessmentResponse:
  result = request.app.state.credit_model.assess(payload)
  explanation, explanation_source = await request.app.state.explainer.explain(
    payload, result
  )

  return AssessmentResponse(
    request_id=payload.request_id,
    decision=result.decision,
    status=result.status,
    credit_class=result.credit_class,
    credit_class_source=result.credit_class_source,
    risk_class=result.risk_class,
    confidence=result.confidence,
    probabilities=result.probabilities,
    explanation=explanation,
    explanation_source=explanation_source,
  )


if __name__ == "__main__":
  import uvicorn

  uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
