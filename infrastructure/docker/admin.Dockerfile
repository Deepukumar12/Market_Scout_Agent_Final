# Production-grade Admin Dockerfile
FROM node:20-alpine as builder

WORKDIR /app

# Install dependencies - leveraging layer cache
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Final stage - serve with Nginx
FROM nginx:stable-alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Add custom Nginx config for SPA routing with security headers
RUN printf 'server {\n\
    listen 80;\n\
    server_tokens off;\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html index.htm;\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    # Cache static assets\n\
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ {\n\
        root /usr/share/nginx/html;\n\
        expires 1y;\n\
        add_header Cache-Control "public, no-transform";\n\
    }\n\
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
