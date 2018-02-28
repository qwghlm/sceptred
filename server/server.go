package main

import (
    // "fmt"
    "log"
    "net/http"
    "html/template"
)

type Metadata struct {

}

func handler(w http.ResponseWriter, r *http.Request) {

    // Load template
    tmpl := template.Must(template.ParseFiles("templates/index.html"))

    // Fill with ???

    metadata := Metadata{}
    tmpl.Execute(w, metadata)
}

func main() {
    http.HandleFunc("/", handler)
    log.Fatal(http.ListenAndServe(":3001", nil))
} // TODO use PORT
