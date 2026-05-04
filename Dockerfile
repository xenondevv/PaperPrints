FROM node:18-alpine

# Set working directory to backend
WORKDIR /app

# Copy only backend package files first (for Docker layer caching)
COPY backend/package.json backend/package-lock.json ./

# Install production dependencies
RUN npm install --production

# Copy backend source code
COPY backend/src ./src

# Create uploads directory
RUN mkdir -p /app/uploads

# Start the server
CMD ["node", "src/server.js"]
