FROM node:21.4.0-alpine3.18

WORKDIR /app
COPY . /app

RUN yarn install --production --frozen-lockfile

CMD node main.mjs
