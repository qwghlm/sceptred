package main

import (
    "go/build"
    "html/template"
    "io"
    "os"

    "github.com/labstack/echo"
    "github.com/labstack/echo/middleware"
)

// Constants

// SRCPATH represents path to the src code
var SRCPATH = build.Default.GOPATH + "/src/sceptred"

// Renderer

type renderer struct {
    templates *template.Template
}
func (r *renderer) Render(w io.Writer, name string, data interface{}, c echo.Context) error {
    return r.templates.ExecuteTemplate(w, name, data)
}

// Instance

func instance() *echo.Echo {

    // Setup Echo instance
    e := echo.New()

    // Setup template renderer
    e.Renderer = &renderer{
        templates: template.Must(template.ParseGlob(SRCPATH + "/server/templates/*.html")),
    }

    // Handlers are in handlers.go
    e.GET("/", handleIndex)
    e.GET("/data/:gridSquare", handleData)
    e.Static("/static", SRCPATH + "/client/dist/")
    e.File("/favicon.ico", SRCPATH + "/client/dist/favicon.ico")
    return e
}

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
