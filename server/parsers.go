package main

import (
    "encoding/json"
    "io/ioutil"
)

// Parses JSON and returns an interface
func parseJSON(path string) (interface{}, error) {

    var ret interface{}
    jsonFile, err := ioutil.ReadFile(path)
    if err != nil {
        return ret, err
    }
    err = json.Unmarshal(jsonFile, &ret)
    return ret, err
}
