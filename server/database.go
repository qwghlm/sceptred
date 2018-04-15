//+build !test

package sceptred

import (
    "log"
    "os"

    "github.com/getsentry/raven-go"
    "gopkg.in/mgo.v2"
)

// Mongo-specific interfaces

type MongoSession struct {
    *mgo.Session
}
func (s MongoSession) DB(name string) Database {
    return MongoDatabase{Database: s.Session.DB(name)}
}

type MongoDatabase struct {
    *mgo.Database
}
func (d MongoDatabase) C(name string) Collection {
    return MongoCollection{Collection: d.Database.C(name)}
}

type MongoCollection struct {
    *mgo.Collection
}
func (c MongoCollection) FindId(query interface{}) Query {
    return MongoQuery{Query: c.Collection.FindId(query)}
}

type MongoQuery struct {
    *mgo.Query
}
func (q MongoQuery) One(result interface{}) error {
    return q.Query.One(result)
}

// Database session

func databaseSession() Session {
    dbHost := os.Getenv("SCEPTRED_DB_HOST")
    if dbHost == "" {
        dbHost = "localhost"
    }
    session, err := mgo.Dial(dbHost)
    if err != nil {
        raven.CaptureError(err, nil)
        log.Fatal("Cannot connect to Mongo on " + dbHost + ": ", err)
    }
    return MongoSession{session}
}
