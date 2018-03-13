package main

import (
    "go/build"
    "html/template"
    "io"
    "log"

    "github.com/labstack/echo"
    "github.com/labstack/echo/middleware"
    "github.com/dgraph-io/badger"
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

    e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
        Format: "${method} ${uri} | Status: ${status} | Bytes: ${bytes_out} | Time: ${latency_human}\n",
    }))

    // Setup template renderer
    e.Renderer = &renderer{
        templates: template.Must(template.ParseGlob(SRCPATH + "/server/templates/*.html")),
    }

    // Setup database
    opts := badger.DefaultOptions
    opts.Dir = dbDirectory
    opts.ValueDir = dbDirectory
    opts.ReadOnly = true
    db, err := badger.Open(opts)
    if err != nil {
        log.Fatal("Error connecting to database. Check to see if database has been installed, if not follow the instructions in the README");
    }

    dataHandler := &DatabaseHandler{db: db}

    // Handlers are in handlers.go
    e.GET("/", handleIndex)
    e.GET("/data/:gridSquare", dataHandler.get)
    e.Static("/static", SRCPATH + "/client/dist/")
    e.File("/favicon.ico", SRCPATH + "/client/dist/favicon.ico")
    return e

    // TODO Gracefully close DB connection on end


}
