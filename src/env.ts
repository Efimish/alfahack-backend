import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.coerce.number().default(3000),
  POSTGRES_PASSWORD: z.string(),
  DATABASE_URL: z.string(),
  // JWT_SECRET: z.string(),
});

export const env = EnvSchema.parse(process.env);
