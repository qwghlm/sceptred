package main

import (
    "github.com/labstack/echo"
    "regexp"
)

var staticRegexp, _ = regexp.Compile("^(/static|favicon.ico)")
var dataRegexp, _ = regexp.Compile("^/data")

// Caching

func cacheMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
    return func(c echo.Context) error {

        // Different cache times for different types of request
        cacheTime := "60"
        url := c.Request().URL.String()
        if staticRegexp.MatchString(url) {
            cacheTime = "86400"
        } else if dataRegexp.MatchString(url) {
            cacheTime = "900"
        }
        c.Response().Header().Set("Cache-Control", "max-age="+cacheTime)
        return next(c)
    }
}
