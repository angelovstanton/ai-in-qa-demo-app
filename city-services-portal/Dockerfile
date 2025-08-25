# Use Node.js 18 as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache bash curl

# Copy package files for both API and UI
COPY api/package*.json ./api/
COPY ui/package*.json ./ui/

# Install dependencies for both projects
RUN cd api && npm install
RUN cd ui && npm install

# Copy source code
COPY api/ ./api/
COPY ui/ ./ui/

# Build the API
RUN cd api && npm run build

# Build the UI
RUN cd ui && npm run build

# Copy startup script and make executable
COPY docker/startup.sh /startup.sh
RUN chmod +x /startup.sh

# Expose ports
EXPOSE 3001 5173

# Set environment variables
ENV NODE_ENV=production
ENV DATABASE_URL="file:./dev.db"
ENV JWT_SECRET="your-super-secret-jwt-key-change-in-production"
ENV PORT=3001

# Create volume for database persistence
VOLUME ["/app/api/prisma"]

# Start both services
CMD ["/startup.sh"]