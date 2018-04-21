package main

import (
    "go/build"
    "html/template"
    "io"
    "os"
    "regexp"

    "sceptred/server/interfaces"

    "github.com/labstack/echo"
    "github.com/labstack/echo/middleware"
)

// Constants

var srcPath = build.Default.GOPATH + "/src/sceptred"

var staticRegexp, _ = regexp.Compile("^(/static|favicon.ico)")
var dataRegexp, _ = regexp.Compile("^/data")

// Caching
func cacheHeader(next echo.HandlerFunc) echo.HandlerFunc {
    return func(c echo.Context) error {

        // Different cache times for different types of request
        cacheTime := "60"
        url := c.Request().URL.String()
        if staticRegexp.MatchString(url) {
            cacheTime = "86400"
        } else if dataRegexp.MatchString(url) {
            cacheTime = "900"
        }
        c.Response().Header().Set("Cache-Control", "max-age="+cacheTime)
        return next(c)
    }
}

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
        e.Use(cacheHeader)
        e.Use(middleware.Gzip())
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
