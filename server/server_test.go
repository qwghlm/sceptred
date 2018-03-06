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
    code, body := request(t, "GET", "/", nil)
    assert.Equal(t, http.StatusOK, code)
    assert.Contains(t, body, "Sceptred")

}

func Test404(t *testing.T) {

    code, _ := request(t, "GET", "/foo", nil)
    assert.Equal(t, http.StatusNotFound, code)

}

// FIXME: Tests do not work yet in CI!
//
// func TestData(t *testing.T) {

//     code, body := request(t, "GET", "/data/nt27", nil)
//     assert.Equal(t, http.StatusOK, code)
//     assert.Contains(t, body, "-2.1,-2.1")

// }

// func TestInvalidData(t *testing.T) {

//     code, _ := request(t, "GET", "/data/xxxx", nil)
//     assert.Equal(t, http.StatusBadRequest, code)

// }

// func TestMissingSquare(t *testing.T) {

//     code, _ := request(t, "GET", "/data/aa00", nil)
//     assert.Equal(t, http.StatusNoContent, code)

// }
