import { Elysia } from "elysia";
import { BusinessLoanApplicationSchema } from "@/request.model";

export const requestsController = new Elysia({ prefix: "requests" })
  .get(
    "",
    async () => {
      return [];
    },
    {
      detail: {
        summary: "Получить все заявки",
      },
      response: {
        200: BusinessLoanApplicationSchema.array(),
      },
    },
  )
  // .get(
  //   "/:id",
  //   async ({ params: { id } }) => {
  //     return {};
  //   },
  //   {
  //     detail: {
  //       summary: "Получить заявку по ID",
  //     },
  //     response: {
  //       200: BusinessLoanApplicationSchema,
  //     },
  //   },
  // )
  .post(
    "",
    async ({ body }) => {
      console.log(body);
    },
    {
      detail: {
        summary: "Подать заявку",
      },
      body: BusinessLoanApplicationSchema,
    },
  );
