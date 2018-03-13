package main

import (
    // "fmt"
    "bytes"
    "encoding/binary"
    "net/http"
    "regexp"
    "strings"

    "github.com/labstack/echo"
    "github.com/dgraph-io/badger"
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

const dbDirectory = "./terrain/db/";

type DatabaseHandler struct {
    db *badger.DB
}

func (h *DatabaseHandler) get (c echo.Context) error {

    // Get the grid square required
    gridSquare := strings.ToLower(c.Param("gridSquare"))

    // Validate
    if match, _ := regexp.MatchString("^[a-z]{2}[0-9]{2}$", gridSquare); !match {
        return echo.NewHTTPError(http.StatusBadRequest)
    }

    // Get the big grid square's data
    squareSize := 50

    // Squares to read into
    // TODO Convert this to [200][200]
    var linearSquares [40000]int16
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
    if err != nil {
        if err.Error() == "Key not found" {
            return echo.NewHTTPError(http.StatusNoContent, nil)
        } else {
            return echo.NewHTTPError(http.StatusInternalServerError, nil)
        }
    }

    // Turn linear squares into a square of them
    squares := make([][]int16, 200)
    for i:=0; i<200; i++ {
        squares[i] = linearSquares[i*200:(i+1)*200]
    }

    // Return JSON
    ret := gridData{gridDataMeta{squareSize, strings.ToUpper(gridSquare)}, squares}
    return c.JSON(http.StatusOK, ret)

}

