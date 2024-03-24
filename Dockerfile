FROM node:20.5.1-alpine as build

WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20.5.1-alpine as server

ARG DOCKER_TAG
ENV APP_VERSION=$DOCKER_TAG

WORKDIR /src
COPY --from=build /src/node_modules ./node_modules
COPY ./src .
RUN touch .env

CMD [ "node", "server.js" ]