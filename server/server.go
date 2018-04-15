//+build !test

package sceptred

import (
    "os"
    "github.com/getsentry/raven-go"
)

func main() {

    // Setup error reporting if on production
    if os.Getenv("SCEPTRED_ENV") == "production" {
        raven.SetDSN("https://0cc92e2330ee46bd83a27e06504da3f7:4d4161f3853941748b6cc0dab3a32fc5@sentry.io/305800")
    }

    // Setup database session and instance
    s := databaseSession()
    e := Instance(s)

    // Start serving
    port := os.Getenv("SCEPTRED_PORT")
    if port == "" {
        port = "8000"
    }
    e.Logger.Fatal(e.Start(":"+port))

}
