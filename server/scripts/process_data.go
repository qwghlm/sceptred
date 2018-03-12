package main

import (
    "archive/zip"
    "bufio"
    "encoding/gob"
    "fmt"
    "math"
    "path"
    "path/filepath"
    "os"
    "strings"
    "strconv"
)

// Processes the OS data into a more usable Gob format

const sourceDirectory = "../terrain/data/";
const outputDirectory = "../terrain/gob/";

func main() {

    // Check to see if data exists
    if _, err := os.Stat(sourceDirectory); os.IsNotExist(err) {
        fmt.Println("Terrain data folder not found. Please follow the instructions in the README, install it, and then try again")
        os.Exit(1)
    }

    filepath.Walk(sourceDirectory, walker)

}

func walker(pathname string, info os.FileInfo, err error) error {

    basename := path.Base(pathname)

    if info.IsDir() {
        if basename == "data" {
            return nil;
        }
        if basename != "nt" { // TODO Remove this
            return filepath.SkipDir
        }
    } else {
        if basename[len(basename)-4:] != ".zip" {
            return nil;
        }

        squareValues, _ := parseZippedAsc(pathname)
        gridSquare := strings.Split(basename, "_")[0]
        outputFile := outputDirectory + gridSquare[:2] + ".gob"
        data := make(map[string][][]int16)
        _ = load(outputFile, &data)
        data[gridSquare] = squareValues
        _ = save(outputFile, data)

    }

    return nil
}

// Encode via Gob to file
func save(path string, object interface{}) error {
    file, err := os.Create(path)
    if err == nil {
        encoder := gob.NewEncoder(file)
        encoder.Encode(object)
    }
    file.Close()
    return err
 }

// Decode Gob file
func load(path string, object interface{}) error {
    file, err := os.Open(path)
    if err == nil {
        decoder := gob.NewDecoder(file)
        err = decoder.Decode(object)
    }
    file.Close()
    return err
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
func parseZippedAsc(dataPath string) ([][]int16, error) {

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
    ret := make([][]int16, len(lines))

    maxVal := int16(math.MinInt16)
    for i:=0; i<len(lines); i++ {
        line := strings.Fields(lines[i])
        retLine := make([]int16, len(line))
        for j:=0; j<len(line); j++ {
            floatVal, _ := strconv.ParseFloat(line[j], 64)
            retLine[j] = int16(math.Round(floatVal))
            if (retLine[j] > maxVal) {
                maxVal = retLine[j]
            }
        }
        ret[i] = retLine
    }

    // TODO Is this worth it? Check Inchkeith
    if maxVal < 0 {
        fmt.Println(dataPath, maxVal)
    }
    return ret, nil

}
