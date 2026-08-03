# Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# Production server stage
FROM nginx:alpine

# Copy built static files to Nginx
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# Add custom Nginx configuration if needed for React Router fallback
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
