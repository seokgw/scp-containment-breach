FROM node:24-alpine
WORKDIR /app
COPY --chown=node:node challenges/static/server.mjs ./server.mjs
COPY --chown=node:node public/evidence ./evidence
USER node
EXPOSE 8081
CMD ["node", "server.mjs"]
