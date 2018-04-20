//+build !test

package main

import (
    "fmt"
    "log"
    "os"

    "sceptred/server/interfaces"

    "github.com/getsentry/raven-go"
    "gopkg.in/mgo.v2"
)

// Mongo-specific interfaces

type MongoSession struct {
    *mgo.Session
}
func (s MongoSession) DB(name string) interfaces.Database {
    return MongoDatabase{Database: s.Session.DB(name)}
}

type MongoDatabase struct {
    *mgo.Database
}
func (d MongoDatabase) C(name string) interfaces.Collection {
    return MongoCollection{Collection: d.Database.C(name)}
}

type MongoCollection struct {
    *mgo.Collection
}
func (c MongoCollection) FindId(query interface{}) interfaces.Query {
    return MongoQuery{Query: c.Collection.FindId(query)}
}

type MongoQuery struct {
    *mgo.Query
}
func (q MongoQuery) One(result interface{}) error {
    return q.Query.One(result)
}

// Database session

func databaseSession() interfaces.Session {

    dbUser := os.Getenv("SCEPTRED_DB_USER")
    dbPassword := os.Getenv("SCEPTRED_DB_PASSWORD")

    // Blank auth if either no db user & password
    var dbAuth string
    if dbUser == "" || dbPassword == "" {
        dbAuth = ""
    } else {
        dbAuth = fmt.Sprintf("%s:%s@", dbUser, dbPassword)
    }

    dbHost := os.Getenv("SCEPTRED_DB_HOST")
    if dbHost == "" {
        dbHost = "localhost"
    }
    dbPort := os.Getenv("SCEPTRED_DB_PORT")
    if dbPort == "" {
        dbPort = "27017"
    }
    dbName := os.Getenv("SCEPTRED_DB_NAME")
    if dbName == "" {
        dbName = "sceptred"
    }

    dbString := fmt.Sprintf("%s%s:%s/%s", dbAuth, dbHost, dbPort, dbName)
    session, err := mgo.Dial(dbString)
    if err != nil {
        raven.CaptureError(err, nil)
        log.Fatal("Cannot connect to Mongo on " + dbString + ": ", err)
    }
    return MongoSession{session}
}
