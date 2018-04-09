package main

import (
    "net/http"
    "os"
    "regexp"
    "strings"

    "github.com/getsentry/raven-go"
    "github.com/labstack/echo"
    "gopkg.in/mgo.v2"
)

// Index

func handleIndex(c echo.Context) error {

    // Load JSON metdata
    m, err := parseJSON(srcPath + "/client/dist/manifest.json")
    if err != nil {
        raven.CaptureError(err, nil)
        return err
    }
    metadata := m.(map[string]interface{})
    metadata["IsProduction"] = os.Getenv("SCEPTRED_ENV") == "production"
    // Complete template
    return c.Render(http.StatusOK, "index", metadata)
}

// Data

type gridData struct {
    Meta gridDataMeta      `json:"meta" bson:"meta"`
    Heights [][]int16      `json:"heights" bson:"heights"`
    Land [][]int16         `json:"land" bson:"land"`
}

type gridDataMeta struct {
    SquareSize int         `json:"squareSize" bson:"squareSize"`
    GridReference string   `json:"gridReference" bson:"gridReference"`
}

const gridSize = 200

type databaseHandler struct {
    session *mgo.Session
}

func (h *databaseHandler) get (c echo.Context) error {

    // Get the grid square required
    gridSquare := strings.ToUpper(c.Param("gridSquare"))

    // Validate
    if match, _ := regexp.MatchString("^[A-Z]{2}[0-9]{2}$", gridSquare); !match {
        return echo.NewHTTPError(http.StatusBadRequest)
    }

    s := h.session.DB("local").C("sceptred")
    var result *gridData
    err := s.FindId(gridSquare).One(&result)

    if err != nil {

        // If no key found, return a blank object
        if err.Error() == "not found" {
            heights := make([][]int16, 0)
            land := make([][]int16, 0)
            squareSize := 50
            result = &gridData{gridDataMeta{squareSize, gridSquare}, heights, land}
        } else {
            raven.CaptureError(err, nil)
            return echo.NewHTTPError(http.StatusInternalServerError, nil)
        }
    }

    // Return JSON
    return c.JSON(http.StatusOK, result)

}

