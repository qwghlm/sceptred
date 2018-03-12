//+build !test

package main

import (
    "os"

    "github.com/labstack/echo/middleware"
)

func main() {

    // Setup instance and add logging middleware
    e := instance()
    e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
      Format: "${method} ${uri} | Status: ${status} | Bytes: ${bytes_out} | Time: ${latency_human}\n",
    }))

    // Start serving
    port := os.Getenv("PORT")
    if port == "" {
        port = "8000"
    }
    e.Logger.Fatal(e.Start(":"+port))

}
