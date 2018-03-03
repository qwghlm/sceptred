package main

import (
    "encoding/json"
    "fmt"
    "go/build"
    "html/template"
    "io"
    "io/ioutil"
    "net/http"
    "os"
    "regexp"
    "strings"

    "github.com/labstack/echo"
    "github.com/labstack/echo/middleware"
)

var SRCPATH = fmt.Sprintf("%v/src/sceptred", build.Default.GOPATH)

type Renderer struct {
    templates *template.Template
}

func (r *Renderer) Render(w io.Writer, name string, data interface{}, c echo.Context) error {
    return r.templates.ExecuteTemplate(w, name, data)
}

func getIndex(c echo.Context) error {

    // Load JSON
    var metadata interface{}
    jsonFile, err := ioutil.ReadFile(SRCPATH + "/client/dist/manifest.json")
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

type GridDataMeta struct {
    SquareSize int         `json:"squareSize"`
    GridReference string   `json:"gridReference"`
}
type GridData struct {
    Meta GridDataMeta      `json:"meta"`
    Data [][]int           `json:"data"`
}

func getData(c echo.Context) error {

    // Get the grid square required
    gridSquare := strings.ToLower(c.Param("gridSquare"))

    // Check for correct address
    if match, _ := regexp.MatchString("[a-z]{2}[0-9]{2}", gridSquare); !match {
        return c.JSON(http.StatusNotFound, nil)
    }

    // Check for path
    dataPath := SRCPATH + fmt.Sprintf("/terrain/data/%v/%v_OST50GRID_20170713.zip",
        gridSquare[0:2], gridSquare)
    if _, err := os.Stat(dataPath); os.IsNotExist(err) {
        return c.JSON(http.StatusNoContent, nil)
    }

    // TODO Open zip file
    // TODO Parse zip file
    // TODO Return the array of integers

    // Value to return
    ret := GridData{GridDataMeta{50, strings.ToUpper(gridSquare)}, [][]int{}}

    return c.JSON(http.StatusOK, ret)

}

func instance() *echo.Echo {

    // Setup Echo instance
    e := echo.New()

    // Setup template renderer
    e.Renderer = &Renderer{
        templates: template.Must(template.ParseGlob(SRCPATH + "/server/templates/*.html")),
    }

    // Handlers
    e.GET("/", getIndex)
    e.GET("/data/:gridSquare", getData)
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

    // Start serving
    // TODO Set port in config/env
    port := "8000"
    e.Logger.Fatal(e.Start(":"+port))

}
