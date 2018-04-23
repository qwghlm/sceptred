package main

import (
    "go/build"
    "html/template"
    "io"
    "os"

    "sceptred/server/interfaces"

    "github.com/labstack/echo"
    "github.com/labstack/echo/middleware"
)

// Constants

var srcPath = build.Default.GOPATH + "/src/sceptred"

// Renderer

type renderer struct {
    templates *template.Template
}

func (r *renderer) Render(w io.Writer, name string, data interface{}, c echo.Context) error {
    return r.templates.ExecuteTemplate(w, name, data)
}

// Instance

func Instance(s interfaces.Session) *echo.Echo {

    // Setup Echo instance
    e := echo.New()

    // Add middleware
    e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
        Format: "${method} ${uri} | Status: ${status} | Bytes: ${bytes_out} | Time: ${latency_human}\n",
    }))

    if os.Getenv("SCEPTRED_ENV") == "production" {
        e.Use(middleware.Gzip())
        e.Use(cacheMiddleware)
        e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
            AllowOrigins: []string{"https://sceptred.qwghlm.co.uk"},
        }))
        e.Use(middleware.SecureWithConfig(middleware.SecureConfig{
            HSTSMaxAge: 3600,
        }))
        // TODO Set domain as config option
        // TODO Increase HSTS max age once stable rollout achieved
    }

    // Setup template renderer
    e.Renderer = &renderer{
        templates: template.Must(template.ParseGlob(srcPath + "/server/templates/*.html")),
    }

    // Setup database
    dataHandler := &databaseHandler{session: s}

    // Handlers are in handlers.go
    e.GET("/", handleIndex)
    e.GET("/data/:gridSquare", dataHandler.get)

    e.Static("/static", srcPath+"/client/dist/")
    e.File("/favicon.ico", srcPath+"/client/dist/favicon.ico")
    return e

}
