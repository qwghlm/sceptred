package main

import (
    // "fmt"
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
    // TODO Error handling
    tmpl := template.Must(template.ParseFiles("templates/index.html"))

    // Load JSON
    // TODO Error handling
    jsonFile, _ := ioutil.ReadFile("../client/dist/manifest.json")
    var metadata interface{}
    json.Unmarshal(jsonFile, &metadata)

    // Complete template
    tmpl.Execute(w, metadata)
}

func main() {

    // Handler for index
    http.HandleFunc("/", handler)

    // Handle for static
    http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("../client/dist/"))))

    // Start serving
    log.Fatal(http.ListenAndServe(":3001", nil))

} // TODO use PORT

// TODO Serve on port 8000 via Gin/whatever
