FROM golang:1.10

WORKDIR /go/src/sceptred
COPY . .

RUN go get -d -v ./server/...
RUN go install -v ./server/...

ENTRYPOINT /go/bin/server

EXPOSE 8000
