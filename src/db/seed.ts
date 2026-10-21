import { seed } from "drizzle-seed";
import { db, schema } from "@/db";

await seed(db, schema);
