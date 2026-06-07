# Stage 1: Build the React application
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Serve the build directory using Nginx
FROM nginx:stable-alpine

# Copy compiled static files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration to support SPA routing fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
