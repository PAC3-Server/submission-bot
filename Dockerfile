FROM node:17.8.0

ENV NODE_ENV=production

WORKDIR /app

COPY ["package.json", "yarn.lock", "./"]

RUN yarn install --immutable --immutable-cache

COPY . .

RUN printf "yarn build && yarn start" > entrypoint.sh

EXPOSE 8020

CMD ["/bin/sh", "entrypoint.sh"]
