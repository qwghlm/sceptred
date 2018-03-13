//+build !test

package main

import (
    "os"
)

func main() {

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
