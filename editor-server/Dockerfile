FROM ekidd/rust-musl-builder:latest as backend
WORKDIR /home/rust/src
COPY . .
RUN cargo build --release

FROM scratch
COPY --from=backend /home/rust/src/target/x86_64-unknown-linux-musl/release/editor-server .
EXPOSE 3030
CMD [ "./editor-server" ]
