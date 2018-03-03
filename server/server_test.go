package main

import (
    "io/ioutil"
    "net/http"
    "net/http/httptest"
    "testing"

    "github.com/stretchr/testify/assert"
)

// https://www.netlify.com/blog/2016/10/20/building-a-restful-api-in-go/
func request(t *testing.T, method, path string, body interface{}) (int, string) {

    req := httptest.NewRequest(method, path, nil)
    rsp := httptest.NewRecorder()

    e := instance()
    e.Logger.SetOutput(ioutil.Discard)
    e.ServeHTTP(rsp, req)
    return rsp.Code, rsp.Body.String()
}

func TestIndex(t *testing.T) {

    // Set up environment
    code, _ := request(t, "GET", "/", nil)
    assert.Equal(t, http.StatusOK, code)
    // TODO Body assertion

}

func Test404(t *testing.T) {

    code, _ = request(t, "GET", "/foo", nil)
    assert.Equal(t, http.StatusNotFound, code)

}
