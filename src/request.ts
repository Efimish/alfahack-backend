import { Elysia } from "elysia";
import { z } from "zod";

const CreateRequestSchema = z.object({
  // Название компании
  companyName: z.string(),
  // ИНН
  // ОРГН
  // Вид Деятельности
  // 2 Выручка за последний год
  // 2 Чистая прибыль
  // 2 Оборотные средства
  // 2 Кредитная нагрузка
  // 3 Цель финансирования
  // 3 Запрашиваемая сумма
  // 3 Срок кредитования
  // 4 Документы
  // 5 Комментарий к заявке
});

const ResponseSchema = z.object({
  message: z.string(),
});

export const requestController = new Elysia({ prefix: "request" }).post(
  "",
  async ({ body }) => {
    console.log(body);
    return { message: "ok" };
  },
  {
    detail: {
      summary: "Подать заявку",
    },
    body: CreateRequestSchema,
    response: {
      200: ResponseSchema,
    },
  },
);
