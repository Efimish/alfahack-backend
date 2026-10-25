import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { z } from "zod";

// Переменные окружения из Docker имеют приоритет. Для локального запуска
// читаем .env из текущей директории, затем из корня репозитория.
config({ quiet: true });
config({
  path: fileURLToPath(new URL("../../.env", import.meta.url)),
  quiet: true,
});

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  PYTHON_API_URL: z.url().default("http://127.0.0.1:8000"),
  PYTHON_API_TIMEOUT_MS: z.coerce.number().int().positive().default(45_000),
  INTERNAL_API_KEY: z.string().min(1),
});

export const env = EnvSchema.parse(process.env);
