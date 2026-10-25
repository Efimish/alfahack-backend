import { z } from "zod";
import { ASSESSMENT_STATUSES } from "@/request/request.constants";

/**
 * Ответ внутреннего Python-сервиса (POST /assess).
 * Хранится в requests.assessment и отдается банковскому клиенту.
 */
export const AssessmentSchema = z
  .object({
    requestId: z.guid().nullable(),
    decision: z.enum(["approve", "alternative", "reject"]),
    status: z.enum(ASSESSMENT_STATUSES),
    creditClass: z.int().min(0).max(3),
    creditClassSource: z.enum(["provided", "heuristic"]),
    riskClass: z.int().min(0).max(2),
    confidence: z.number().min(0).max(1),
    probabilities: z
      .object({
        reject: z.number(),
        alternative: z.number(),
        approve: z.number(),
      })
      .meta({ description: "Вероятности классов риска" }),
    explanation: z
      .object({
        summary: z.string().meta({ description: "Суть решения" }),
        factors: z.object({
          creditRatingAndAmount: z.string(),
          termAndPurpose: z.string(),
        }),
        recommendation: z.string(),
      })
      .meta({ description: "Объяснение решения для кредитного инспектора" }),
    explanationSource: z.enum(["llm", "fallback"]),
  })
  .meta({ description: "Результат ML/LLM-оценки заявки" });

export type Assessment = z.infer<typeof AssessmentSchema>;
