# ============================================================
# Stage 1: Build frontend (Vite + React + TypeScript)
# ============================================================
FROM node:24-alpine AS frontend-builder

WORKDIR /app

# Copy dependency manifests and install
COPY package.json package-lock.json ./
RUN npm install -g npm@11
RUN npm config set fetch-retries 5 && npm config set fetch-retry-mintimeout 20000 && npm config set fetch-retry-maxtimeout 120000
RUN npm ci --no-optional --no-fund --no-audit

# Copy source files and build
COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts ./
COPY index.html ./
COPY public/ public/
COPY src/ src/

# Copy data files (default vocabulary seed JSON is imported by src/domain/defaultVocabulary.ts)
COPY data/ data/

# Copy docs (LANGUAGE_CARD_FORMAT.md is imported by src/services/aiAssistantAgent.ts)
COPY docs/ docs/

# In production, API is served from the same origin, so use relative URLs
ARG VITE_LANG_LAB_API_ENDPOINT=""
ENV VITE_LANG_LAB_API_ENDPOINT=$VITE_LANG_LAB_API_ENDPOINT

RUN npm run build

# ============================================================
# Stage 2: Build backend (Go)
# ============================================================
FROM golang:1.24-alpine AS backend-builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache gcc musl-dev

# Copy Go module files and download dependencies
COPY backend/go.mod backend/go.sum ./
RUN go mod download

# Copy source and build
COPY backend/ ./
RUN CGO_ENABLED=1 go build -o /app/server .

# ============================================================
# Stage 3: Runtime image
# ============================================================
FROM alpine:3.21

# Install runtime dependencies (for SQLite)
RUN apk add --no-cache ca-certificates tzdata

# Create non-root user
RUN adduser -D -h /app appuser

# Copy built artifacts
COPY --from=backend-builder /app/server /app/server
COPY --from=frontend-builder /app/dist /app/dist

# Create data directory for SQLite database (will be mounted as volume)
RUN mkdir -p /app/data && chown -R appuser:appuser /app

WORKDIR /app
USER appuser

# Environment variables
ENV LANG_LAB_ADDR=0.0.0.0:8090
ENV LANG_LAB_DB_PATH=/app/data/language-lab.sqlite
ENV LANG_LAB_FRONTEND_DIR=/app/dist

EXPOSE 8090

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:8090/healthz || exit 1

ENTRYPOINT ["/app/server"]