package main

import (
    "fmt"
    "net/http"
    "os"
    "regexp"
    "strings"

    "github.com/labstack/echo"
)

// Index

func handleIndex(c echo.Context) error {

    // Load JSON metdata
    metadata, err := parseJSON(SRCPATH + "/client/dist/manifest.json")
    if err != nil {
        return err
    }

    // Complete template
    return c.Render(http.StatusOK, "index", metadata)
}

// Data

type GridDataMeta struct {
    SquareSize int         `json:"squareSize"`
    GridReference string   `json:"gridReference"`
}
type GridData struct {
    Meta GridDataMeta      `json:"meta"`
    Data [][]int           `json:"data"`
}

func handleData(c echo.Context) error {

    // Get the grid square required
    gridSquare := strings.ToLower(c.Param("gridSquare"))

    // Validate
    if match, _ := regexp.MatchString("[a-z]{2}[0-9]{2}", gridSquare); !match {
        return c.JSON(http.StatusNotFound, nil)
    }

    // Check for path
    lines, err := getZippedAsc(gridSquare)
    if err != nil {
        if os.IsNotExist(err) {
            return c.JSON(http.StatusNoContent, nil)
        } else {
            return c.JSON(500, nil)
        }
    }

    fmt.Println(string(lines[0]))

    // TOOD Parse .asc file

    // TODO Store parsed .asc file

    // Value to return
    ret := GridData{GridDataMeta{50, strings.ToUpper(gridSquare)}, [][]int{}}

    return c.JSON(http.StatusOK, ret)

}

func getZippedAsc(gridSquare string) ([]string, error) {

    lines := []string{}
    dataPath := SRCPATH + fmt.Sprintf("/terrain/data/%v/%v_OST50GRID_20170713.zip",
        gridSquare[0:2], gridSquare)

    r, err := parseZip(dataPath)
    if err != nil {
        return lines, err
    }
    defer r.Close()

    for _, f := range r.File {
        if !strings.HasSuffix(f.Name, ".asc") {
            continue
        }
        lines = readLines(f)
        break
    }
    return lines, nil
}
