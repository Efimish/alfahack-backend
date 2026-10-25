import { Elysia } from "elysia";
import {
  ApiRequestInsertSchema,
  ApiRequestSelectSchema,
  dbToApi,
  apiToDb,
} from "@/request/request.model";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

export const requestsController = new Elysia({ prefix: "requests" })
  .get(
    "",
    async () => {
      const requests = await db.select().from(schema.requests);
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
      return dbToApi(request);
    },
    {
      detail: {
        summary: "Получить заявку по ID",
      },
      response: {
        200: ApiRequestSelectSchema,
      },
    },
  )
  .post(
    "",
    async ({ body }) => {
      const [request] = await db
        .insert(schema.requests)
        .values(apiToDb(body))
        .returning();
      return dbToApi(request);
    },
    {
      detail: {
        summary: "Подать заявку",
      },
      body: ApiRequestInsertSchema,
      response: {
        200: ApiRequestSelectSchema,
      },
    },
  );
