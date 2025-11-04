# syntax=docker/dockerfile:1.6

# ===== Frontend builder =====
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Install deps
COPY frontend/package*.json ./
# Prefer clean install if lockfile exists
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy the rest of the frontend source and build
COPY frontend/. .

# Build Next.js app
ENV NODE_ENV=production
RUN npm run build

# ===== Frontend runtime =====
FROM node:20-alpine AS frontend
WORKDIR /app/frontend

# Copy only what is needed to run `next start`
COPY --from=frontend-builder /app/frontend/node_modules ./node_modules
COPY --from=frontend-builder /app/frontend/.next ./.next
COPY --from=frontend-builder /app/frontend/public ./public
COPY --from=frontend-builder /app/frontend/package*.json ./

# Expose Next.js port
EXPOSE 3001

# Environment defaults
ENV NODE_ENV=production \
    PORT=3001

CMD ["npm", "run", "start", "--", "-p", "3001"]
