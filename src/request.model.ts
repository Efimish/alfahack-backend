import { z } from "zod";

const pdfFileSchema = z.custom<File>(
  (value) =>
    typeof File !== "undefined" &&
    value instanceof File &&
    value.type === "application/pdf",
  { message: "Файл должен быть в формате PDF" },
);

export const BusinessLoanApplicationSchema = z.object({
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
          description: "ОГРН (основной государственный регистрационный номер)",
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
});

export type BusinessLoanApplication = z.infer<
  typeof BusinessLoanApplicationSchema
>;
