package main

import (
    "net/http"
    "net/http/httptest"
    "testing"

    "github.com/labstack/echo"
    "github.com/stretchr/testify/assert"
)

func TestIndex(t *testing.T) {

    // Set up environment
    e := instance()

    // New context
    req := httptest.NewRequest(echo.GET, "/", nil)
    rec := httptest.NewRecorder()
    c := e.NewContext(req, rec)

    assert.NoError(t, getIndex(c))
    assert.Equal(t, http.StatusOK, rec.Code)

}
