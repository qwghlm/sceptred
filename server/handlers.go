package main

import (
    // "fmt"
    "bytes"
    "encoding/binary"
    "net/http"
    "regexp"
    "strings"

    "github.com/getsentry/raven-go"
    "github.com/dgraph-io/badger"
    "github.com/labstack/echo"
)

// Index

func handleIndex(c echo.Context) error {

    // Load JSON metdata
    metadata, err := parseJSON(srcPath + "/client/dist/manifest.json")
    if err != nil {
        raven.CaptureError(err, nil)
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

const gridSize = 200

type databaseHandler struct {
    db *badger.DB
}

func (h *databaseHandler) get (c echo.Context) error {

    // Get the grid square required
    gridSquare := strings.ToLower(c.Param("gridSquare"))

    // Validate
    if match, _ := regexp.MatchString("^[a-z]{2}[0-9]{2}$", gridSquare); !match {
        return echo.NewHTTPError(http.StatusBadRequest)
    }

    // Get the big grid square's data
    squareSize := 50

    // Squares to read into. Data has to be stored linearly, we then convert it to
    // a 200x200 grid
    var linearSquares [gridSize*gridSize]int16
    err := h.db.View(func(txn *badger.Txn) error {
        item, err := txn.Get([]byte(gridSquare))
        if err != nil {
            return err
        }
        byteData, _ := item.Value()
        err = binary.Read(bytes.NewReader(byteData), binary.LittleEndian, &linearSquares)
        if err != nil {
            return err
        }
        return nil
    })

    var squares [][]int16
    if err != nil {
        if err.Error() == "Key not found" {
            squares = make([][]int16, 0)
        } else {
            raven.CaptureError(err, nil)
            return echo.NewHTTPError(http.StatusInternalServerError, nil)
        }
    } else {
        // Turn linear array of squares into a 200x200 grid of them
        squares = make([][]int16, gridSize)
        for i:=0; i<gridSize; i++ {
            squares[i] = linearSquares[i*gridSize:(i+1)*gridSize]
        }
    }

    // Return JSON
    ret := gridData{gridDataMeta{squareSize, strings.ToUpper(gridSquare)}, squares}
    return c.JSON(http.StatusOK, ret)

}

