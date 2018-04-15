# Sceptred

_This royal throne of kings, this sceptred isle,_<br>
_This earth of majesty, this seat of Mars,_<br>
_This other Eden, demi-paradise,_<br>
_This fortress built by Nature for her self_<br>
&nbsp;&nbsp;— William Shakespeare, _Richard II_

[_Sceptred_](https://sceptred.qwghlm.co.uk/) is a project to model the island of Great Britain in 3D, using open-source data.

![GitHub package version](https://img.shields.io/github/package-json/v/qwghlm/sceptred.svg)
[![Build Status](https://travis-ci.org/qwghlm/sceptred.svg?branch=master)](https://travis-ci.org/qwghlm/sceptred)
[![codecov](https://codecov.io/gh/qwghlm/sceptred/branch/master/graph/badge.svg)](https://codecov.io/gh/qwghlm/sceptred)

## Overview

Sceptred is a web application, split between a browser-based client and a server.

* The client is written in [Typescript](http://www.typescriptlang.org/), and depends on [Three.js](https://threejs.org) to render the terrain in a WebGL context.
* The server is written in [Go](https://golang.org/), and is ultimately backed by an adaptation of the Ordnance Survey's [Terrain 50](https://www.ordnancesurvey.co.uk/business-and-government/products/terrain-50.html) dataset in a MongoDB database.

The project is designed to use modern web development tools & practices. The client is compiled into JavaScript with [Webpack](https://webpack.js.org/) and [Babel](https://babeljs.io/), and has automated testing in [Jest](https://facebook.github.io/jest/). The server is packaged up & deployed with [Docker](https://www.docker.com/), and the entire repo has integrations with [Travis](https://travis-ci.org/qwghlm/sceptred), [Codecov](https://codecov.io/gh/qwghlm/sceptred) and [Sentry](https://sentry.io).

## Developing

### Before you start

Prerequisites: Go, Node + npm, [Glide](https://github.com/Masterminds/glide).

To install Webpack and associated build & test functionality, run:

    $ npm install

To install the vendor files, it is recommended you use Glide:

    $ glide install

This only needs to be done once, before you first run.

TODO Database installation

### Development server & watcher

To run the dev server, run:

    $ npm run serve

To actively develop on the TypeScript, i.e. run Webpack in watch mode, run:

    $ npm run watch

## Testing

Client-side testing is done with Jest, and can be run as:

    $ npm run test:js

Server-side testing is done with Go's `testing` package, and can be run as:

    $ npm run test:go

All tests can be run with:

    $ npm run test

## Deploying

Building a Docker container is straightforward:

    $ docker build -t sceptred .

And to run locally:

    $ docker run -it -p 8000:8000 sceptred

A GCloud deploy (if you have Google App Engine set up) is done with:

    $ gcloud app deploy

## Architecture

### Client

The client consists of:

* React Components for the form and the map renderer (`app.tsx` and `map.tsx`)
* A supporting library of modules, the most important of which represents the world (`world.ts`). Also paying attention to are the libraries for handling the OS Grid (`grid.ts`) and for parsing data into correct geometry objects (`data.ts`)

These are located in `client/src/js`. The biggest dependency is [Three.js](https://threejs.org) but we also rely on [React](https://reactjs.org) and [ReactDOM](https://reactjs.org/docs/react-dom.html) for the UI. The colouring of the terrain is handled by [chroma-js](https://gka.github.io/chroma.js/).

The CSS is currently handled by [Spectre.css](https://picturepan2.github.io/spectre/) (no relation).

### Server

The server is a simple API server written in Go with the help of [Echo](https://echo.labstack.com/). This handles the homepage, and delivering each tile via a JSON API.

### Database

The database is a simple MongoDB database. There is one collection of ~2,800 Documents, each covering a 10x10 grid square in the UK. The format for each is:

    {
        "_id" : "NT27",
        "meta" : {
            "squareSize" : 50,
            "gridReference" : "NT27"
        },
        "heights" : [
            [8, 79, 81, 76, 79, 79, ...],
            ...
        ]
    }

To rebuild the database, you will need two sets of source files:

 * The Ordnance Survey's [OS Terrain 50 dataset](https://www.ordnancesurvey.co.uk/business-and-government/products/terrain-50.html), which can be ordered [here](https://www.ordnancesurvey.co.uk/opendatadownload/products.html#TERR50). Make sure the ASCII Grid format is selected. After downloading, unzip the single zip file and place all of its contents in the directory `terrain/asc`.
 * A shapefile for the United Kingdom's coastline - I have used the `GBR_adm0.shp` shapefile from [http://www.diva-gis.org/gdata](here), which can be reached by selecting United Kingdom / Administrative areas. I have not tested the script with other shapefiles. Download and unzip the shapefiles into `terrain/shp`.

Once installed and unzipped into the above location, `cd` into `terrain/scripts`. Then install the Python libraries (virtualenv is recommended):

    $ pip install -r requirements.txt

And then run the script:

    $ ./process_data.py

On my MacBook Pro, converting the entire UK into the MongoDB database takes about 5-6 minutes.

## Copyright

The source code for this project is licensed under the MIT License.

Mapping data contains Ordnance Survey data © Crown copyright and database right 2017.
