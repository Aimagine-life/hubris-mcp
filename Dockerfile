# Build and run the Hubris MCP server over stdio.
#
# Listing tools needs no credential; calling one needs HUBRIS_API_KEY, which a
# client passes through the environment:
#   docker run -i --rm -e HUBRIS_API_KEY=sk-gw-... hubris-mcp
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json tsconfig.json ./
RUN npm install --ignore-scripts
COPY src ./src
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
RUN npm install --omit=dev --ignore-scripts && npm cache clean --force
COPY --from=build /app/dist ./dist
ENTRYPOINT ["node", "dist/index.js"]
