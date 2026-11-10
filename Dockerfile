# Mismo esquema que ticket-frontend: build con Node y servido con nginx.
FROM node:22-alpine AS build-env

WORKDIR /app

COPY package*.json .npmrc ./
RUN npm install

COPY . .

ARG BUILD_ENV=dev
RUN npm run build:$BUILD_ENV

FROM nginx:alpine

COPY --from=build-env /app/dist/cdr/browser /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
