ARG NODE_IMAGE=node:20-alpine3.18


FROM $NODE_IMAGE AS base
RUN apk --no-cache add dumb-init
RUN apk add --no-cache git
RUN mkdir -p /home/node/app && chown node:node /home/node/app
WORKDIR /home/node/app
USER node


FROM base AS production
COPY --chown=node:node package.json yarn.lock ./
COPY --chown=node:node . ./
COPY --chown=node:node  .env .env
ARG PORT=3000
ENV NODE_ENV=production
ENV PORT=$PORT
RUN yarn install --production
EXPOSE $PORT
CMD [ "dumb-init", "node", "index.js" ]