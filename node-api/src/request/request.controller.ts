import { Elysia, status } from "elysia";
import { z } from "zod";
import { db, schema } from "@/db";
import {
  ApiRequestInsertSchema,
  ApiRequestSelectSchema,
  apiToDb,
  dbToApi,
} from "@/request/request.model";
import type { RequestStatus } from "@/request/request.constants";
import type { Assessment } from "@/request/assessment.model";
import { assessApplication } from "@/request/python-api.client";
import { desc, eq } from "drizzle-orm";

const ErrorSchema = z.object({
  message: z.string(),
});

export const requestsController = new Elysia({ prefix: "/requests" })
  .get(
    "",
    async () => {
      const requests = await db
        .select()
        .from(schema.requests)
        .orderBy(desc(schema.requests.createdAt));
      return requests.map(dbToApi);
    },
    {
      detail: {
        summary: "Получить все заявки",
      },
      response: {
        200: ApiRequestSelectSchema.array(),
      },
    },
  )
  .get(
    "/:id",
    async ({ params: { id } }) => {
      const [request] = await db
        .select()
        .from(schema.requests)
        .where(eq(schema.requests.id, id));

      if (!request) {
        return status(404, { message: "Заявка не найдена" });
      }

      return dbToApi(request);
    },
    {
      detail: {
        summary: "Получить заявку по ID",
      },
      params: z.object({
        id: z.guid().meta({ description: "ID заявки" }),
      }),
      response: {
        200: ApiRequestSelectSchema,
        404: ErrorSchema,
      },
    },
  )
  .post(
    "",
    async ({ body }) => {
      const [created] = await db
        .insert(schema.requests)
        .values(apiToDb(body))
        .returning();

      let assessment: Assessment | null = null;
      let requestStatus: RequestStatus = created.status;

      try {
        assessment = await assessApplication({
          requestId: created.id,
          financials: body.financials,
          financing: body.financing,
        });
        requestStatus = assessment.status;
      } catch (error) {
        // Заявка уже сохранена: не теряем ее из-за недоступности ML-сервиса.
        console.error("Не удалось получить ML-оценку заявки", {
          requestId: created.id,
          error,
        });
        requestStatus = "Повторная проверка";
      }

      const [request] = await db
        .update(schema.requests)
        .set({ assessment, status: requestStatus })
        .where(eq(schema.requests.id, created.id))
        .returning();

      return status(201, dbToApi(request));
    },
    {
      detail: {
        summary: "Подать заявку",
        description:
          "Сохраняет заявку и синхронно запрашивает ML/LLM-оценку во внутреннем Python-сервисе. " +
          "Если сервис недоступен, заявка сохраняется со статусом «Повторная проверка».",
      },
      body: ApiRequestInsertSchema,
      response: {
        201: ApiRequestSelectSchema,
      },
    },
  );
