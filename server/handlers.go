package main

import (
    "net/http"
    "os"
    "regexp"
    "strings"

    "sceptred/server/interfaces"

    "github.com/getsentry/raven-go"
    "github.com/labstack/echo"
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

type GridData struct {
    Meta    GridDataMeta    `json:"meta" bson:"meta"`
    Heights [][]interface{} `json:"heights" bson:"heights"`
}

type GridDataMeta struct {
    SquareSize    int    `json:"squareSize" bson:"squareSize"`
    GridReference string `json:"gridReference" bson:"gridReference"`
}

type databaseHandler struct {
    session interfaces.Session
}

const gridSize = 200

func (h *databaseHandler) get(c echo.Context) error {

    // Get the grid square required
    gridSquare := strings.ToUpper(c.Param("gridSquare"))

    // Validate
    if match, _ := regexp.MatchString("^[A-Z]{2}[0-9]{2}$", gridSquare); !match {
        return echo.NewHTTPError(http.StatusBadRequest)
    }

    dbCollection := "sceptred"
    s := h.session.DB("").C(dbCollection)
    var result *GridData
    err := s.FindId(gridSquare).One(&result)

    if err != nil {

        // If no key found, return a blank object
        if err.Error() == "not found" {
            heights := make([][]interface{}, 0)
            squareSize := 50
            result = &GridData{
                Meta: GridDataMeta{
                    SquareSize:    squareSize,
                    GridReference: gridSquare,
                },
                Heights: heights,
            }
        } else {
            raven.CaptureError(err, nil)
            return echo.NewHTTPError(http.StatusInternalServerError, nil)
        }
    }

    // Return JSON
    return c.JSON(http.StatusOK, result)

}
