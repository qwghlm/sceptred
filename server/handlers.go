package main

import (
    "fmt"
    "net/http"
    "os"
    "regexp"
    "strings"
    "strconv"

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
    Data [][]float64       `json:"data"`
}

func handleData(c echo.Context) error {

    // Get the grid square required
    gridSquare := strings.ToLower(c.Param("gridSquare"))

    // Validate
    if match, _ := regexp.MatchString("^[a-z]{2}[0-9]{2}$", gridSquare); !match {
        return echo.NewHTTPError(http.StatusBadRequest)
    }

    // Check for path
    squareSize := 50
    lines, err := parseZippedAsc(gridSquare)
    if err != nil {
        if os.IsNotExist(err) {
            return echo.NewHTTPError(http.StatusNoContent)
        } else {
            return err
        }
    }

    // Value to return
    ret := GridData{GridDataMeta{squareSize, strings.ToUpper(gridSquare)}, lines}
    return c.JSON(http.StatusOK, ret)

}

func parseZippedAsc(gridSquare string) ([][]float64, error) {

    dataPath := SRCPATH + fmt.Sprintf("/terrain/data/%v/%v_OST50GRID_20170713.zip",
        gridSquare[0:2], gridSquare)

    r, err := parseZip(dataPath)
    if err != nil {
        return nil, err
    }

    // Pull lines out of the ASC file
    var lines []string
    for _, f := range r.File {
        if !strings.HasSuffix(f.Name, ".asc") {
            continue
        }
        lines = readLines(f)
        break
    }
    r.Close()

    // Parse strings in file and turn into array of floats
    lines = lines[5:]
    ret := make([][]float64, len(lines))
    for i:=0; i<len(lines); i++ {
        line := strings.Fields(lines[i])
        retLine := make([]float64, len(line))
        for j:=0; j<len(line); j++ {
            retLine[j], _ = strconv.ParseFloat(line[j], 64)
        }
        ret[i] = retLine
    }
    return ret, nil
}
