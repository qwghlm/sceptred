package main

import (
    "fmt"
    "encoding/json"
    "io/ioutil"
    "log"
    "net/http"
    "html/template"
)

func handler(w http.ResponseWriter, r *http.Request) {

    if r.URL.Path != "/" {
        http.NotFound(w, r)
        return
    }

    // Load template
    tmpl := template.Must(template.ParseFiles("templates/index.html"))

    // Load JSON
    jsonFile, _ := ioutil.ReadFile("../client/dist/manifest.json")
    var metadata interface{}
    json.Unmarshal(jsonFile, &metadata)
    fmt.Printf("%+v", metadata)
    // Complete template
    tmpl.Execute(w, metadata)
}

func main() {
    http.HandleFunc("/", handler)
    log.Fatal(http.ListenAndServe(":3001", nil))
} // TODO use PORT

// TODO Serve on port 8000
