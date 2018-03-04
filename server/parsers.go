package main

import (
    "archive/zip"
    "bufio"
    "encoding/json"
    "io/ioutil"
    "os"
)

func parseZip(zipPath string) (*zip.ReadCloser, error) {

    // Check existence
    _, err := os.Stat(zipPath)
    if err != nil{
        return nil, err
    }

    // Open zip file
    r, err := zip.OpenReader(zipPath)
    if err != nil {
        return nil, err
    }
    return r, nil
}

func readLines(f *zip.File) []string {

    fp, _ := f.Open()
    reader := bufio.NewReader(fp)
    lines := []string{}
    for {
        line, err := reader.ReadBytes('\n')
        if err != nil {
            break
        }
        lines = append(lines, string(line))
    }
    return lines

}

func parseJSON(path string) (interface{}, error) {

    var ret interface{}
    jsonFile, err := ioutil.ReadFile(path)
    if err != nil {
        return ret, err
    }
    err = json.Unmarshal(jsonFile, &ret)
    return ret, err
}

