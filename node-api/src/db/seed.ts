import { db, schema } from "@/db";

const sampleRequests: (typeof schema.requests.$inferInsert)[] = [
  {
    companyName: "ООО «Ромашка»",
    companyInn: "7701234567",
    companyOgrn: "1027700123456",
    companyActivity: "Розничная торговля",
    annualRevenue: "12000000.00",
    netProfit: "1500000.00",
    workingCapital: "3000000.00",
    debtBurden: "1000000.00",
    financingPurpose: "Пополнение оборотных средств",
    requestedAmount: "840000.00",
    termMonths: 18,
    comment: "Тестовая заявка: стабильная выручка",
  },
  {
    companyName: "ИП Иванов",
    companyInn: "770123456789",
    companyOgrn: "304770012345678",
    companyActivity: "Услуги",
    annualRevenue: "5000000.00",
    netProfit: "100000.00",
    workingCapital: "500000.00",
    debtBurden: "2200000.00",
    financingPurpose: "Другое",
    requestedAmount: "1500000.00",
    termMonths: 36,
    comment: "Тестовая заявка: высокая долговая нагрузка",
  },
  {
    companyName: "ООО «Старт»",
    companyInn: "7801234567",
    companyOgrn: "1157800123456",
    companyActivity: "Производство",
    annualRevenue: "3000000.00",
    netProfit: "300000.00",
    workingCapital: "900000.00",
    debtBurden: "400000.00",
    financingPurpose: "Покупка оборудования",
    requestedAmount: "2000000.00",
    termMonths: 24,
    comment: "Тестовая заявка: покупка оборудования",
  },
];

const existing = await db
  .select({ id: schema.requests.id })
  .from(schema.requests)
  .limit(1);

if (existing.length > 0) {
  console.log("В таблице requests уже есть данные, seed пропущен");
  process.exit(0);
}

const inserted = await db
  .insert(schema.requests)
  .values(sampleRequests)
  .returning({ id: schema.requests.id });

console.log(`Добавлено тестовых заявок: ${inserted.length}`);
process.exit(0);
