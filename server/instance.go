package main

import (
    "go/build"
    "html/template"
    "io"

    "github.com/labstack/echo"
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
