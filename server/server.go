package main

import (
    "fmt"
    "encoding/json"
    "io/ioutil"
    "log"
    "net/http"
    "html/template"
)

type appHandler func(http.ResponseWriter, *http.Request) error

func (fn appHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    if err := fn(w, r); err != nil {
        fmt.Println(err.Error())
        http.Error(w, "Application error", 500)
    }
}

func indexHandler(w http.ResponseWriter, r *http.Request) error {

    if r.URL.Path != "/" {
        http.NotFound(w, r)
        return nil
    }

    // Load template
    indexTemplate, err := template.ParseFiles("templates/index.html")
    if err != nil {
        return err
    }

    // Load JSON
    var metadata interface{}
    jsonFile, err := ioutil.ReadFile("../client/dist/manifest.json")
    if err != nil {
        return err
    }
    err = json.Unmarshal(jsonFile, &metadata)
    if err != nil {
        return err
    }

    // Complete template
    return indexTemplate.Execute(w, metadata)
}

func main() {

    // Handler for index
    http.Handle("/", appHandler(indexHandler))

    // Handle for static
    http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("../client/dist/"))))

    // Start serving
    log.Fatal(http.ListenAndServe(":3001", nil))

} // TODO use PORT
