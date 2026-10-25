import * as pg from "drizzle-orm/pg-core";
import type { Assessment } from "@/request/assessment.model";
import {
  FINANCING_PURPOSES,
  REQUEST_STATUSES,
} from "@/request/request.constants";

export const requests = pg.pgTable("requests", {
  id: pg.uuid().defaultRandom().primaryKey(),

  /** Название компании */
  companyName: pg.text().notNull(),
  /** ИНН (идентификационный номер налогоплательщика) */
  companyInn: pg.text().notNull(),
  /** ОГРН (основной государственный регистрационный номер) */
  companyOgrn: pg.text().notNull(),
  /** Вид деятельности */
  companyActivity: pg.text().notNull(),

  // До триллиона, учитывая копейки 999,999,999,999.99
  /** Выручка за последний год */
  annualRevenue: pg.numeric({ precision: 14, scale: 2 }).notNull(),
  /** Чистая прибыть */
  netProfit: pg.numeric({ precision: 14, scale: 2 }).notNull(),
  /** Оборотные средства */
  workingCapital: pg.numeric({ precision: 14, scale: 2 }).notNull(),
  /** Кредитная нагрузка */
  debtBurden: pg.numeric({ precision: 14, scale: 2 }).notNull(),

  /** Цель финансирования */
  financingPurpose: pg.text({ enum: FINANCING_PURPOSES }).notNull(),
  /** Запрашиваемая сумма */
  requestedAmount: pg.numeric({ precision: 14, scale: 2 }).notNull(),
  /** Срок кредитования (в месяцах) */
  termMonths: pg.integer().notNull(),

  /** Комментарий к заявке */
  comment: pg.text(),

  /** Статус заявки */
  status: pg.text({ enum: REQUEST_STATUSES }).default("Подана").notNull(),

  /** Результат ML/LLM-оценки (null, пока оценка не получена) */
  assessment: pg.jsonb().$type<Assessment>(),

  /** Дата создания заявки */
  createdAt: pg.timestamp({ withTimezone: true }).defaultNow().notNull(),
});
