package main

import (
    "fmt"
    "go/build"
    "html/template"
    "io"
    "os"

    "github.com/labstack/echo"
    "github.com/labstack/echo/middleware"
)

// Constants

// TODO Make this a const
var SRCPATH = fmt.Sprintf("%v/src/sceptred", build.Default.GOPATH)

// Renderer

type Renderer struct {
    templates *template.Template
}
func (r *Renderer) Render(w io.Writer, name string, data interface{}, c echo.Context) error {
    return r.templates.ExecuteTemplate(w, name, data)
}

// Instance

func instance() *echo.Echo {

    // Setup Echo instance
    e := echo.New()

    // Setup template renderer
    e.Renderer = &Renderer{
        templates: template.Must(template.ParseGlob(SRCPATH + "/server/templates/*.html")),
    }

    // Handlers
    e.GET("/", handleIndex)
    e.GET("/data/:gridSquare", handleData)
    e.Static("/static", SRCPATH + "/client/dist/")

    return e
}

func main() {

    // Check to see if data exists
    if _, err := os.Stat(SRCPATH + "/terrain/data"); os.IsNotExist(err) {
        fmt.Println("Terrain data folder not found. Please follow the instructions in the README, install it, and then try again")
        os.Exit(1)
    }

    // Setup instance and add logging middleware
    e := instance()
    e.Use(middleware.Logger())
    // TODO Better format of log

    // Start serving
    // TODO Set port in config/env
    port := "8000"
    e.Logger.Fatal(e.Start(":"+port))

}
