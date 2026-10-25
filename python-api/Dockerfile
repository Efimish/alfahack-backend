FROM python:3.12.12-slim-bookworm

# Копируем только бинарники uv из официального образа: он distroless и не
# содержит /bin/sh, поэтому использовать его как базовый образ нельзя.
COPY --from=ghcr.io/astral-sh/uv:0.13.5 /uv /uvx /bin/

WORKDIR /app

ENV UV_NO_DEV=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never \
    PYTHONUNBUFFERED=1

# Сначала зависимости — слой кэшируется, пока не изменится lock-файл.
COPY pyproject.toml uv.lock ./
RUN uv sync --locked --no-install-project

COPY . .
RUN uv sync --locked

EXPOSE 8000

CMD ["uv", "run", "--frozen", "--no-sync", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
