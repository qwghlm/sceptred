# Build binary
FROM golang:1.10

WORKDIR /go/src/sceptred

# Setup Go packages with Glide
RUN mkdir -p $GOPATH/bin && \
    curl https://glide.sh/get | sh
COPY glide.yaml glide.lock ./
RUN glide install

# Install the server
COPY ./server ./server
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o /go/bin/server ./server/

# Bundle client files as well
COPY ./client ./client

# Production binary
FROM scratch
ENV SCEPTRED_ENV production
COPY --from=0 /go/bin/server /serve
COPY --from=0 /go/src/sceptred/client /go/src/sceptred/client
COPY --from=0 /go/src/sceptred/server/templates /go/src/sceptred/server/templates
ENTRYPOINT ["/serve"]
EXPOSE 8080
