package main

import (
    "encoding/json"
    "html/template"
    "io"
    "io/ioutil"
    "net/http"

    "github.com/labstack/echo"
    "github.com/labstack/echo/middleware"
)

type Renderer struct {
    templates *template.Template
}

func (r *Renderer) Render(w io.Writer, name string, data interface{}, c echo.Context) error {
    return r.templates.ExecuteTemplate(w, name, data)
}

func getIndex(c echo.Context) error {

    // Load JSON
    var metadata interface{}
    jsonFile, err := ioutil.ReadFile("../client/dist/manifest.json")
    if err != nil {
        return err
    }
    err = json.Unmarshal(jsonFile, &metadata)
    if err != nil {
        return err
    }

    // Complete template
    return c.Render(http.StatusOK, "index", metadata)
}

func instance() *echo.Echo {

    // Setup Echo instance
    e := echo.New()

    // Setup template renderer
    e.Renderer = &Renderer{
        templates: template.Must(template.ParseGlob("./templates/*.html")),
    }
    return e
}

func main() {

    e := instance()

    // Setup middleware
    e.Use(middleware.Logger())

    // Handler for index
    e.GET("/", getIndex)

    // Handle for static
    e.Static("/static", "../client/dist/")

    // Start serving
    // TODO Set port in config/env
    port := "8000"
    e.Logger.Fatal(e.Start(":"+port))

}
