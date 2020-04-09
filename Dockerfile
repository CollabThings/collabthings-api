FROM node:latest

ENV PATH "$PATH:./node_modules/.bin"
EXPOSE 8008

RUN curl -L https://raw.githubusercontent.com/pnpm/self-installer/master/install.js | node
RUN pnpm --version

RUN echo update 20200408_1100

RUN pnpm install --save types @types/express express body-parser serve-static

RUN pnpm install leveldown
RUN pnpm install --save ssb-server ssb-db
RUN pnpm install --save ssb-feed ssb-keys
RUN pnpm install --save ipfs

RUN cat package.json

ADD package.json package.json
RUN pnpm install
RUN cat package.json

RUN ls node_modules/.bin/
ENTRYPOINT node start.js


