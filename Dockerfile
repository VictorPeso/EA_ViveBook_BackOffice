# syntax=docker/dockerfile:1

ARG NODE_VERSION=24.13.1

################################################################################
# Base image
FROM node:${NODE_VERSION}-alpine AS base

WORKDIR /usr/src/app

################################################################################
# Build the application
FROM base AS build

ARG BACKOFFICE_API_URL=http://ea3-api.upc.edu
ENV BACKOFFICE_API_URL=${BACKOFFICE_API_URL}

# Disable Husky hooks inside the container
ENV HUSKY=0

# Install all dependencies required to compile the frontend
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci

# Copy application source
COPY . .

# Build the frontend
RUN npm run build

# Generate runtime configuration
RUN printf "window.__VIVEBOOK_ENV__ = { apiUrl: '%s' };\n" "$BACKOFFICE_API_URL" \
    > /usr/src/app/dist/mini-spa/browser/env.js

################################################################################
# Serve the built frontend with Nginx
FROM nginx:stable-alpine AS final

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /usr/src/app/dist/mini-spa/browser /usr/share/nginx/html

EXPOSE 4000

CMD ["nginx", "-g", "daemon off;"]
