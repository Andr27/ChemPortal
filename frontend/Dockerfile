FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build


FROM nginx:alpine

# Копируем собранный React
COPY --from=builder /app/build /usr/share/nginx/html

# Копируем nginx конфиг (из контекста сборки, не из ..)
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
