import { z } from "zod";
import { schema } from "@/db";
import { AssessmentSchema } from "@/request/assessment.model";
import {
  FINANCING_PURPOSES,
  MAX_MONEY,
  REQUEST_STATUSES,
} from "@/request/request.constants";

export const ApiRequestInsertSchema = z
  .object({
    company: z
      .object({
        name: z
          .string()
          .trim()
          .min(1, "Укажите название компании")
          .max(500)
          .meta({
            description: "Название компании",
            examples: ["ООО «Тмыв денег»"],
          }),
        inn: z
          .string()
          .trim()
          .regex(/^\d{10}(\d{2})?$/, "ИНН должен содержать 10 или 12 цифр")
          .meta({
            description: "ИНН (идентификационный номер налогоплательщика)",
            examples: ["0000111112"],
          }),
        ogrn: z
          .string()
          .trim()
          .regex(/^\d{13}(\d{2})?$/, "ОГРН должен содержать 13 или 15 цифр")
          .meta({
            description:
              "ОГРН (основной государственный регистрационный номер)",
            examples: ["0112233444445"],
          }),
        activity: z
          .string()
          .trim()
          .min(1, "Укажите вид деятельности")
          .max(500)
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
        annualRevenue: z.number().finite().min(0).max(MAX_MONEY).meta({
          description: "Выручка за последний год",
        }),
        netProfit: z.number().finite().min(-MAX_MONEY).max(MAX_MONEY).meta({
          description: "Чистая прибыль (может быть отрицательной)",
        }),
        workingCapital: z
          .number()
          .finite()
          .min(-MAX_MONEY)
          .max(MAX_MONEY)
          .meta({
            description: "Оборотные средства",
          }),
        debtBurden: z.number().finite().min(0).max(MAX_MONEY).meta({
          description: "Кредитная нагрузка",
        }),
      })
      .meta({ description: "Финансовые показатели бизнеса" }),

    financing: z
      .object({
        purpose: z.enum(FINANCING_PURPOSES).meta({
          description: "Цель финансирования",
        }),
        requestedAmount: z.number().finite().positive().max(MAX_MONEY).meta({
          description: "Запрашиваемая сумма",
        }),
        termMonths: z.int().positive().max(360).meta({
          description: "Срок кредитования (в месяцах)",
        }),
      })
      .meta({ description: "Финансирование" }),

    comment: z
      .string()
      .trim()
      .max(2000)
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
  status: z.enum(REQUEST_STATUSES).meta({
    description: "Статус заявки",
  }),
  assessment: AssessmentSchema.nullable().meta({
    description: "Результат ML/LLM-оценки (null, если оценка не удалась)",
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
  termMonths: data.financing.termMonths,
  comment: data.comment?.trim() || null,
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
  status: data.status,
  assessment: data.assessment ?? null,
  createdAt: data.createdAt.toISOString(),
});
