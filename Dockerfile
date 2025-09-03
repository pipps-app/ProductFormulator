FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 5000

# Add health check endpoint
RUN echo 'app.get("/api/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));' >> server/routes.ts

# Start the application
CMD ["npm", "start"]
