FROM ekidd/rust-musl-builder:latest as backend
WORKDIR /home/rust/src
COPY . .
RUN cargo build --release

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
RUN npm run build

FROM scratch
COPY --from=frontend /usr/src/app/build build
COPY --from=backend /home/rust/src/target/x86_64-unknown-linux-musl/release/rust-warp .
USER 1000:1000
CMD [ "./rust-warp" ]
