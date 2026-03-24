FROM node:22-slim

WORKDIR /app

# Install backend dependencies
COPY package.json package-lock.json* ./
RUN npm install --silent

# Install frontend dependencies
COPY frontend/package.json frontend/package-lock.json* ./frontend/
RUN cd frontend && npm install --silent

# Copy source
COPY . .

# Build frontend
RUN cd frontend && npx vite build

# The built frontend is served by the backend in production
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001 5173

# Start both servers
CMD ["sh", "-c", "npx tsx src/server.ts & cd frontend && npx vite --host 0.0.0.0 && wait"]
