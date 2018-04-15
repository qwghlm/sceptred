package sceptred_test

import (
    "errors"
    "io/ioutil"
    "net/http"
    "net/http/httptest"
    "strings"
    "testing"

    "sceptred/server"
    mock "sceptred/server/mocks"

    "github.com/golang/mock/gomock"
    "github.com/stretchr/testify/assert"

)

func makeMockData(size int) sceptred.GridData {

    heights := make([][]interface{}, size)
    for i, _ := range heights {
        heights[i] = make([]interface{}, size)
        for j, _ := range heights[i] {
            heights[i][j] = 2
        }
    }

    grid := sceptred.GridData{
        sceptred.GridDataMeta{50, "NT27"},
        heights,
    }
    return grid
}

// https://www.netlify.com/blog/2016/10/20/building-a-restful-api-in-go/
func request(t *testing.T, method, path string, body interface{}) (int, string) {

    // Set up request
    req := httptest.NewRequest(method, path, nil)
    rsp := httptest.NewRecorder()

    // Set up mock database
    ctrl := gomock.NewController(t)
    defer ctrl.Finish()

    q := mock.NewMockQuery(ctrl)
    d := mock.NewMockDatabase(ctrl)
    c := mock.NewMockCollection(ctrl)
    s := mock.NewMockSession(ctrl)
    if (strings.HasPrefix(path, "/data") && !strings.HasSuffix(path, "xxxx")) {

        if (path[len(path)-4:] == "nt27") {
            grid := makeMockData(2)
            q.EXPECT().One(gomock.Any()).SetArg(0, &grid)
        } else {
            q.EXPECT().One(gomock.Any()).Return(errors.New("not found"))
        }
        c.EXPECT().FindId(gomock.Any()).Return(q)
        d.EXPECT().C(gomock.Any()).Return(c)
        s.EXPECT().DB(gomock.Any()).Return(d)
    }

    e := sceptred.Instance(s)

    // Run test
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

func TestData(t *testing.T) {

    // Test for NT27, which is present in both the test DB and the production DB
    code, body := request(t, "GET", "/data/nt27", nil)
    assert.Equal(t, http.StatusOK, code)
    assert.Contains(t, body, "[2,2")

}

func TestMissingData(t *testing.T) {

    // Test for NT38, which is not present in both the test DB and the production DB
    code, body := request(t, "GET", "/data/nt38", nil)
    assert.Equal(t, http.StatusOK, code)
    assert.Contains(t, body, "[]")

}

func TestInvalidData(t *testing.T) {

    code, _ := request(t, "GET", "/data/xxxx", nil)
    assert.Equal(t, http.StatusBadRequest, code)

}
