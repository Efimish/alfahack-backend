FROM ghcr.io/astral-sh/uv:0.13.5
WORKDIR /app
ENV UV_NO_DEV=1
COPY . .
RUN uv sync --locked
CMD ["uv", "run", "main.py"]
