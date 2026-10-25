FROM node:26.12.1-alpine
WORKDIR /app

RUN npm install -g pnpm@12.14.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 3000

# Миграции идемпотентны; ретраи внутри скрипта ждут готовности Postgres.
CMD ["sh", "-c", "pnpm db:migrate && pnpm start"]
