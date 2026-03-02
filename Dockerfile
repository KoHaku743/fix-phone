FROM node:20-alpine

WORKDIR /app/backend

# Copy backend dependencies first for layer caching
COPY backend/package*.json ./

RUN npm ci --omit=dev

# Copy source files
COPY backend/ ./
COPY frontend/ ../frontend/

# Persist the SQLite database outside the container
VOLUME ["/app/backend/data"]

RUN mkdir -p /app/backend/data

ENV NODE_ENV=production \
    DB_PATH=/app/backend/data/phone_repair.db

EXPOSE 3000

CMD ["node", "server.js"]
