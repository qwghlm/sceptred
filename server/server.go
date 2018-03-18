//+build !test

package main

import (
    "os"
    "github.com/getsentry/raven-go"
)

func main() {

    // Setup error reporting
    raven.SetDSN("https://0cc92e2330ee46bd83a27e06504da3f7:4d4161f3853941748b6cc0dab3a32fc5@sentry.io/305800")

    // Setup instance and add logging middleware
    e := instance()

    // Start serving
    port := os.Getenv("PORT")
    if port == "" {
        port = "8000"
    }
    e.Logger.Fatal(e.Start(":"+port))

    // TODO Gracefully close DB connection on end

}
