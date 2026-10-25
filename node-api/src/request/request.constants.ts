export const FINANCING_PURPOSES = [
  "Пополнение оборотных средств",
  "Покупка оборудования",
  "Закупка товаров, сырья, материалов",
  "Расширение бизнеса",
  "Уплата налогов и обязательных платежей",
  "Покупка, ремонт, обустройство помещения",
  "Рефинансирование действующих кредитов",
  "Другое",
] as const;

export type FinancingPurpose = (typeof FINANCING_PURPOSES)[number];

/** Максимум для numeric(14,2): 12 цифр до запятой и 2 после. */
export const MAX_MONEY = 999_999_999_999.99;

export const ASSESSMENT_STATUSES = [
  "Одобрена",
  "Отклонена",
  "Предложены другие условия",
] as const;

export type AssessmentStatus = (typeof ASSESSMENT_STATUSES)[number];

export const REQUEST_STATUSES = [
  "Подана",
  "Проверка данных",
  "Ожидает данных",
  "Повторная проверка",
  "Одобрена",
  "Отклонена",
  "Предложены другие условия",
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];
