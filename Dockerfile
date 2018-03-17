FROM golang:1.10

WORKDIR /go/src/sceptred

# Setup Go packages with Glide
RUN mkdir -p $GOPATH/bin && \
    curl https://glide.sh/get | sh

COPY ./glide.yaml ./glide.yaml
COPY ./glide.lock ./glide.lock

RUN glide install

# Then copy the rest over and install
COPY ./server ./server
COPY ./client ./client

RUN go install -v ./server/...

ENTRYPOINT ["/go/bin/server"]

EXPOSE 8000
