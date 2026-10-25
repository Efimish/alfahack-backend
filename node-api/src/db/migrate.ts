import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "@/db";

const MAX_ATTEMPTS = 30;
const RETRY_DELAY_MS = 1000;

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("Миграции применены");
    process.exit(0);
  } catch (error) {
    console.error(`Миграция ${attempt}/${MAX_ATTEMPTS} не удалась`, error);

    if (attempt === MAX_ATTEMPTS) {
      process.exit(1);
    }

    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
  }
}
