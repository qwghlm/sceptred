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

type gridData struct {
    Meta gridDataMeta      `json:"meta"`
    Data [][]float64       `json:"data"`
}

type gridDataMeta struct {
    SquareSize int         `json:"squareSize"`
    GridReference string   `json:"gridReference"`
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
        }
        return err
    }

    // Value to return
    ret := gridData{gridDataMeta{squareSize, strings.ToUpper(gridSquare)}, lines}
    return c.JSON(http.StatusOK, ret)

}

