package main

import (
    "archive/zip"
    "bufio"
    "bytes"
    "encoding/binary"
    "errors"
    "log"
    "io/ioutil"
    "math"
    "os"
    "strings"
    "strconv"
    "time"

    "github.com/dgraph-io/badger"

)

// Processes the OS data into a more usable Gob format

const sourceDirectory = "../terrain/data/";
const outputDirectory = "../terrain/db/";

func main() {

    start := time.Now()

    // Check to see if data exists first
    if _, err := os.Stat(sourceDirectory); os.IsNotExist(err) {
        log.Fatal("Terrain data folder not found. Please follow the instructions in the README, install it, and then try again")
        os.Exit(1)
    }

    // Walk through the data directory
    loadData(sourceDirectory)

    elapsed := time.Since(start)
    log.Printf("Walk took %v\n", elapsed)

}

func loadData(pathname string) {

    opts := badger.DefaultOptions
    opts.Dir = outputDirectory
    opts.ValueDir = outputDirectory
    db, err := badger.Open(opts)
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()

    directories, _ := ioutil.ReadDir(pathname)
    for _, directory := range directories {
        if !directory.IsDir() {
            continue;
        }
        directoryPath := pathname + "/" + directory.Name()

        // Go through each ZIP file...
        files, _ := ioutil.ReadDir(directoryPath)
        for _, file := range files {

            filename := file.Name()
            if filename[len(filename)-4:] != ".zip" {
                continue;
            }

            // Parse zipped file and get the square values. If an error occurs, skip & log
            squares, err := parseZippedAsc(directoryPath + "/" + filename)
            gridSquare := strings.Split(filename, "_")[0]
            if err != nil {
                log.Printf("Skipping %v\n", gridSquare)
                continue;
            }

            buf := new(bytes.Buffer)
            err = binary.Write(buf, binary.LittleEndian, squares)
            if err != nil {
                log.Println("binary.Write failed:", err)
            }

            err = db.Update(func(txn *badger.Txn) error {
                err := txn.Set([]byte(gridSquare), buf.Bytes())
                return err
            })
            if err != nil {
                log.Println(err)
            }
        }
    }
    db.PurgeOlderVersions()
}

// Parses a ZIP files and returns a Read/Close interface
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

// Reads lines of a zipped file and returns them as an array of strings
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

// Loads the zipped ASC file
func parseZippedAsc(dataPath string) ([]int16, error) {

    r, err := parseZip(dataPath)
    if err != nil {
        return nil, err
    }

    // Pull lines out of the ASC file
    var lines []string
    for _, f := range r.File {
        if !strings.HasSuffix(f.Name, ".asc") {
            continue
        }
        lines = readLines(f)
        break
    }
    r.Close()

    // Parse strings in file and turn into array of floats
    lines = lines[5:]
    ret := make([]int16, len(lines)*len(lines))

    maxVal := int16(math.MinInt16)

    for i:=0; i<len(lines); i++ {

        line := strings.Fields(lines[i])

        for j:=0; j<len(line); j++ {

            floatVal, _ := strconv.ParseFloat(line[j], 64)
            val := int16(math.Round(floatVal))
            if (val > maxVal) {
                maxVal = val
            }
            ret[i*len(line) + j] = val
        }
    }

    // Don't bother saving anything entirely underwater
    if maxVal < 0 {
        return nil, errors.New("No land data")
    }
    return ret, nil

}
