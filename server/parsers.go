package main

import (
    "encoding/gob"
    "encoding/json"
    "io/ioutil"
    "os"
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

// Decode Gob file
func loadGob(path string, object interface{}) error {
    file, err := os.Open(path)
    if err == nil {
        decoder := gob.NewDecoder(file)
        err = decoder.Decode(object)
    }
    file.Close()
    return err
}
