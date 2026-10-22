FROM node:24-alpine
WORKDIR /app
COPY --chown=node:node server.mjs fixture.json ./
USER node
ENV LAB_HOST=0.0.0.0
EXPOSE 8080
CMD ["node", "server.mjs"]
