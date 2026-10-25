import { env } from "@/env";
import { AssessmentSchema, type Assessment } from "@/request/assessment.model";
import type { ApiRequestInsert } from "@/request/request.model";

type AssessApplicationInput = {
  requestId: string;
  financials: ApiRequestInsert["financials"];
  financing: ApiRequestInsert["financing"];
};

/**
 * Вызывает скрытый Python-сервис. Ошибки намеренно пробрасываются:
 * controller решает, что сохранение заявки важнее недоступности ML.
 */
export async function assessApplication({
  requestId,
  financials,
  financing,
}: AssessApplicationInput): Promise<Assessment> {
  const url = `${env.PYTHON_API_URL.replace(/\/+$/, "")}/assess`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-internal-api-key": env.INTERNAL_API_KEY,
    },
    body: JSON.stringify({ requestId, financials, financing }),
    signal: AbortSignal.timeout(env.PYTHON_API_TIMEOUT_MS),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(
      `Python API responded with ${response.status}: ${details.slice(0, 500)}`,
    );
  }

  return AssessmentSchema.parse(await response.json());
}
