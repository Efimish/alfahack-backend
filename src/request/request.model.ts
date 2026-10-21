import { z } from "zod";
import { schema } from "@/db";

const pdfFileSchema = z.custom<File>(
  (value) =>
    typeof File !== "undefined" &&
    value instanceof File &&
    value.type === "application/pdf",
  { message: "Файл должен быть в формате PDF" },
);

export const ApiRequestInsertSchema = z
  .object({
    company: z
      .object({
        name: z
          .string()
          .trim()
          .min(1, "Укажите название компании")
          .meta({
            description: "Название компании",
            examples: ["ООО «Тмыв денег»"],
          }),
        inn: z
          .string()
          .trim()
          .min(1, "Укажите ИНН")
          .meta({
            description: "ИНН (идентификационный номер налогоплательщика)",
            examples: ["0000111112"],
          }),
        ogrn: z
          .string()
          .trim()
          .min(1, "Укажите ОГРН")
          .meta({
            description:
              "ОГРН (основной государственный регистрационный номер)",
            examples: ["0112233444445"],
          }),
        activity: z
          .string()
          .trim()
          .min(1, "Укажите вид деятельности")
          .meta({
            description: "Вид деятельности",
            examples: [
              "Розничная торговля",
              "Оптовая торговля",
              "Производство",
              "Услуги",
              "Строительство",
              "Сельское хозяйство",
              "IT и телекоммуникации",
              "Финансы и страхование",
              "Недвижимость",
              "Логистика и транспорт",
              "Общепит и гостиничный бизнес",
              "Медицина и здравоохранение",
              "Образование",
              "Развлечения и досуг",
              "Энергетика и ЖКХ",
              "Добыча полезных ископаемых",
              "Другое",
            ],
          }),
      })
      .meta({ description: "Информация о компании" }),

    financials: z
      .object({
        annualRevenue: z.number().meta({
          description: "Выручка за последний год",
        }),
        netProfit: z.number().meta({
          description: "Чистая прибыть",
        }),
        workingCapital: z.number().meta({
          description: "Оборотные средства",
        }),
        debtBurden: z.number().meta({
          description: "Кредитная нагрузка",
        }),
      })
      .meta({ description: "Финансовые показатели бизнеса" }),

    financing: z
      .object({
        purpose: z
          .string()
          .trim()
          .min(1, "Укажите цель финансирования")
          .meta({
            description: "Цель финансирования",
            examples: [
              "Покупка оборудования",
              "Расширение бизнеса",
              "Рефинансирование долга",
              "Другое",
            ],
          }),
        requestedAmount: z.number().min(0).meta({
          description: "Запрашиваемая сумма",
        }),
        termMonths: z.int().min(0).meta({
          description: "Срок кредитования (в месяцах)",
        }),
      })
      .meta({ description: "Финансирование" }),

    // documents: z.array(pdfFileSchema),
    comment: z
      .string()
      .optional()
      .meta({
        description: "Комментарий к заявке",
        examples: ["🙏🙏🙏"],
      }),
  })
  .meta({ description: "Заявка на финансирование" });

export const ApiRequestSelectSchema = ApiRequestInsertSchema.extend({
  id: z.guid().meta({
    description: "Уникальный идентификатор заявки",
  }),
  createdAt: z.iso.datetime().meta({
    description: "Дата и время создания заявки",
  }),
});

export type ApiRequestInsert = z.infer<typeof ApiRequestInsertSchema>;
export type ApiRequestSelect = z.infer<typeof ApiRequestSelectSchema>;

export type DbRequestInsert = typeof schema.requests.$inferInsert;
export type DbRequestSelect = typeof schema.requests.$inferSelect;

export const apiToDb = (data: ApiRequestInsert): DbRequestInsert => ({
  companyName: data.company.name,
  companyInn: data.company.inn,
  companyOgrn: data.company.ogrn,
  companyActivity: data.company.activity,
  annualRevenue: data.financials.annualRevenue.toString(),
  netProfit: data.financials.netProfit.toString(),
  workingCapital: data.financials.workingCapital.toString(),
  debtBurden: data.financials.debtBurden.toString(),
  financingPurpose: data.financing.purpose,
  requestedAmount: data.financing.requestedAmount.toString(),
  termMonths: data.financing.requestedAmount,
  comment: data.comment,
});

export const dbToApi = (data: DbRequestSelect): ApiRequestSelect => ({
  id: data.id,
  company: {
    name: data.companyName,
    inn: data.companyInn,
    ogrn: data.companyOgrn,
    activity: data.companyActivity,
  },
  financials: {
    annualRevenue: Number(data.annualRevenue),
    netProfit: Number(data.netProfit),
    workingCapital: Number(data.workingCapital),
    debtBurden: Number(data.debtBurden),
  },
  financing: {
    purpose: data.financingPurpose,
    requestedAmount: Number(data.requestedAmount),
    termMonths: data.termMonths,
  },
  comment: data.comment ?? undefined,
  createdAt: data.createdAt.toISOString(),
});
