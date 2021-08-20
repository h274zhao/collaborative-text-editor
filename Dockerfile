FROM rust:alpine as wasm
WORKDIR /home/rust/src
RUN apk --no-cache add curl musl-dev
RUN curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
COPY . .
RUN wasm-pack build rust-wasm

FROM node:alpine as frontend
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
COPY --from=wasm /home/rust/src/rust-wasm/pkg rust-wasm/pkg
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
