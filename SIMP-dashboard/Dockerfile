FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_BACKEND_URL
ARG VITE_USE_LIVE_WEATHER
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_USE_LIVE_WEATHER=$VITE_USE_LIVE_WEATHER

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
