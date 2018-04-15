package interfaces

// Generic interfaces, used in databases

type Session interface {
    DB(name string) Database
}
type Database interface {
    C(name string) Collection
}
type Collection interface {
    FindId(id interface{}) Query
}
type Query interface {
    One(result interface{}) error
}
