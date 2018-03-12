package main

import (
    "net/http"
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

type gridData struct {
    Meta gridDataMeta      `json:"meta"`
    Data [][]int16         `json:"data"`
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

    // Get the big grid square's data
    squareSize := 50
    allSquares := make(map[string][][]int16)
    err := loadGob(SRCPATH + "/server/terrain/gob/" + gridSquare[:2] + ".gob", &allSquares)
    if err != nil {
        return err
    }

    squares := allSquares[gridSquare]
    if squares == nil {
        return echo.NewHTTPError(http.StatusNoContent, nil)
    }

    // Value to return
    ret := gridData{gridDataMeta{squareSize, strings.ToUpper(gridSquare)}, squares}
    return c.JSON(http.StatusOK, ret)

}

