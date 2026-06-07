# Production Dockerfile for Smart Investment Advisor Backend
FROM node:20-alpine

WORKDIR /app

# Install dependencies (only production to optimize image size)
COPY package*.json ./
RUN npm install --only=production

# Copy application source
COPY . .

# Secure environment port defaults
EXPOSE 5001

CMD ["node", "app.js"]
